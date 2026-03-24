import { useEffect, useState, useCallback, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { FilePlus, Save, Folder, FileCode, Trash2, Terminal, Users, Circle } from 'lucide-react';
import { useRealtime } from '@/hooks/useRealtime';

interface WorkspaceFile {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  project_id: string;
  updated_at: string;
}

export default function Workspace() {
  const { profile } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [activeFile, setActiveFile] = useState<WorkspaceFile | null>(null);
  const [code, setCode] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [newFileLang, setNewFileLang] = useState('javascript');
  const [saving, setSaving] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState('> Ready\n');
  const [terminalInput, setTerminalInput] = useState('');
  const [showTerminal, setShowTerminal] = useState(false);

  useEffect(() => {
    if (!profile) return;
    const fetch = async () => {
      // Get projects where user is leader or member
      const { data: teams } = await supabase
        .from('teams')
        .select('project_id, projects(id, title)')
        .or(`leader_id.eq.${profile.id}`);
      
      const { data: memberTeams } = await supabase
        .from('team_members')
        .select('team_id, teams(project_id, projects(id, title))')
        .eq('user_id', profile.id);

      const projMap = new Map();
      teams?.forEach((t: any) => { if (t.projects) projMap.set(t.projects.id, t.projects); });
      memberTeams?.forEach((m: any) => { if (m.teams?.projects) projMap.set(m.teams.projects.id, m.teams.projects); });

      // For companies, show their own projects
      if (profile.role === 'company') {
        const { data } = await supabase.from('projects').select('id, title').eq('company_id', profile.id);
        data?.forEach((p) => projMap.set(p.id, p));
      }

      const projs = Array.from(projMap.values());
      setProjects(projs);
      if (projs.length > 0 && !selectedProject) setSelectedProject(projs[0].id);
    };
    fetch();
  }, [profile]);

  const fetchFiles = useCallback(async () => {
    if (!selectedProject) return;
    const { data } = await supabase
      .from('workspace_files')
      .select('*')
      .eq('project_id', selectedProject)
      .order('path');
    if (data) {
      setFiles(data as WorkspaceFile[]);
      // If active file was updated by someone else, refresh its content
      setFiles((prev) => {
        const updated = data.find((f) => f.id === activeFile?.id);
      // The realtime handler updates files list. If the active file is touched remotely, warn.
        if (updated && updated.updated_at !== (activeFile as WorkspaceFile | null)?.updated_at) {
          // show toast on remote update
        }
        return data as WorkspaceFile[];
      });
    }
  }, [selectedProject, activeFile?.id]);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  // Real-time collaboration: sync file changes from other users
  useRealtime([
    {
      table: 'workspace_files',
      filter: selectedProject ? `project_id=eq.${selectedProject}` : undefined,
      onData: (payload) => {
        if (payload.eventType === 'INSERT') {
          setFiles((prev) => [...prev, payload.new as WorkspaceFile].sort((a, b) => a.path.localeCompare(b.path)));
        } else if (payload.eventType === 'UPDATE') {
          setFiles((prev) => prev.map((f) => f.id === payload.new.id ? { ...payload.new as WorkspaceFile } : f));
        } else if (payload.eventType === 'DELETE') {
          setFiles((prev) => prev.filter((f) => f.id !== payload.old.id));
        }
      },
    },
  ], [selectedProject]);

  const openFile = (f: WorkspaceFile) => {
    setActiveFile(f);
    setCode(f.content || '');
  };

  const saveFile = async () => {
    if (!activeFile) return;
    setSaving(true);
    const { error } = await supabase.from('workspace_files')
      .update({ content: code, updated_at: new Date().toISOString() })
      .eq('id', activeFile.id);
    if (error) toast.error(error.message);
    else toast.success('Saved');
    setSaving(false);
  };

  const createFile = async () => {
    if (!selectedProject || !newFileName) return;
    const lang = newFileLang || 'javascript';
    const { error } = await supabase.from('workspace_files').insert({
      project_id: selectedProject,
      name: newFileName,
      path: `/${newFileName}`,
      content: '',
      language: lang,
      created_by: profile?.id,
    });
    if (error) toast.error(error.message);
    else {
      toast.success('File created');
      setNewFileName('');
      // realtime will update the file list automatically
    }
  };

  const deleteFile = async (id: string) => {
    await supabase.from('workspace_files').delete().eq('id', id);
    setFiles((prev) => prev.filter((f) => f.id !== id));
    if (activeFile?.id === id) { setActiveFile(null); setCode(''); }
    toast.success('File deleted');
  };

  const runTerminal = () => {
    // Simulate terminal
    const cmd = terminalInput.trim();
    if (!cmd) return;
    let output = '';
    if (cmd === 'help') output = 'Available: help, clear, echo <text>, date, ls';
    else if (cmd === 'clear') { setTerminalOutput('> '); setTerminalInput(''); return; }
    else if (cmd.startsWith('echo ')) output = cmd.slice(5);
    else if (cmd === 'date') output = new Date().toISOString();
    else if (cmd === 'ls') output = files.map((f) => f.name).join('\n');
    else output = `Command not found: ${cmd}`;
    setTerminalOutput((prev) => prev + `$ ${cmd}\n${output}\n> `);
    setTerminalInput('');
  };

  const readOnly = profile?.role === 'company';

  return (
    <div className="space-y-4 animate-fade-in h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Workspace</h1>
        <div className="flex items-center gap-2">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => setShowTerminal(!showTerminal)}>
            <Terminal className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex gap-0 border border-border rounded-lg overflow-hidden flex-1" style={{ height: 'calc(100% - 3rem)' }}>
        {/* File explorer */}
        <div className="w-56 bg-card border-r border-border flex flex-col shrink-0">
          <div className="p-2 border-b border-border flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Folder className="w-3 h-3" /> Explorer
            </span>
            {!readOnly && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <FilePlus className="w-3 h-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>New File</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>File Name</Label>
                      <Input value={newFileName} onChange={(e) => setNewFileName(e.target.value)} placeholder="index.js" />
                    </div>
                    <div className="space-y-2">
                      <Label>Language</Label>
                      <Select value={newFileLang} onValueChange={setNewFileLang}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="javascript">JavaScript</SelectItem>
                          <SelectItem value="typescript">TypeScript</SelectItem>
                          <SelectItem value="python">Python</SelectItem>
                          <SelectItem value="html">HTML</SelectItem>
                          <SelectItem value="css">CSS</SelectItem>
                          <SelectItem value="json">JSON</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={createFile} className="w-full gradient-primary text-primary-foreground">Create</Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {files.map((f) => (
              <div
                key={f.id}
                className={`flex items-center justify-between px-3 py-1.5 cursor-pointer text-xs hover:bg-muted/50 group ${activeFile?.id === f.id ? 'bg-primary/10 text-primary' : 'text-foreground'}`}
                onClick={() => openFile(f)}
              >
                <span className="flex items-center gap-1.5 truncate">
                  <FileCode className="w-3 h-3 shrink-0" />
                  {f.name}
                </span>
                {!readOnly && (
                  <button onClick={(e) => { e.stopPropagation(); deleteFile(f.id); }} className="opacity-0 group-hover:opacity-100">
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Editor area */}
        <div className="flex-1 flex flex-col min-w-0">
          {activeFile ? (
            <>
              <div className="flex items-center justify-between px-3 py-1.5 bg-muted/30 border-b border-border">
                <span className="text-xs text-foreground font-medium">{activeFile.name}</span>
                {!readOnly && (
                  <Button size="sm" variant="ghost" onClick={saveFile} disabled={saving} className="h-6 text-xs">
                    <Save className="w-3 h-3 mr-1" /> {saving ? 'Saving' : 'Save'}
                  </Button>
                )}
              </div>
              <div className="flex-1">
                <Editor
                  height="100%"
                  language={activeFile.language}
                  value={code}
                  onChange={(val) => setCode(val || '')}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    readOnly,
                    wordWrap: 'on',
                    scrollBeyondLastLine: false,
                  }}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              Select a file or create a new one
            </div>
          )}

          {/* Terminal */}
          {showTerminal && (
            <div className="h-40 bg-foreground/95 border-t border-border flex flex-col">
              <div className="px-3 py-1 text-xs text-background/70 border-b border-background/10">Terminal (simulated)</div>
              <pre className="flex-1 px-3 py-1 text-xs text-background/90 overflow-y-auto font-mono whitespace-pre-wrap">{terminalOutput}</pre>
              <div className="flex border-t border-background/10">
                <span className="px-2 py-1 text-xs text-accent">$</span>
                <input
                  className="flex-1 bg-transparent text-xs text-background outline-none py-1"
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && runTerminal()}
                  placeholder="Type a command..."
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
