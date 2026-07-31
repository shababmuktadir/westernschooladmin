import React, { useState, useEffect, useRef } from "react";
import { getNotes, saveNote, updateNote, deleteNote } from "../services/notebookService";
import { 
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify, 
  List, ListOrdered, Save, Printer, Trash2, Plus, Eye, Edit3, Palette
} from "lucide-react";
import toast from "react-hot-toast";

// আপনার দেওয়া লিস্ট থেকে বাছাইকৃত কাস্টম ফন্ট
const FONTS = [
  { name: "Default (Sans)", value: "Arial, sans-serif" },
  { name: "Kalpurush (Bangla)", value: "'kalpurush', sans-serif" },
  { name: "Siyam Rupali (Bangla)", value: "'Siyamrupali', sans-serif" },
  { name: "SutonnyMJ (Bijoy)", value: "'SutonnyMJ', sans-serif" },
  { name: "Anton (Heading)", value: "'Anton', sans-serif" },
  { name: "Calibri", value: "'calibri', sans-serif" },
  { name: "Times New Roman", value: "'times', serif" },
  { name: "Comic Sans", value: "'comic', cursive" }
];

export default function Notebook() {
  const [notes, setNotes] = useState([]);
  const [activeNote, setActiveNote] = useState(null);
  const [title, setTitle] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const editorRef = useRef(null);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const data = await getNotes();
      setNotes(data);
    } catch (error) {
      toast.error("Failed to load notes");
    }
  };

  // Create New Note
  const handleNewNote = () => {
    setActiveNote(null);
    setTitle("");
    setShowPreview(false);
    if (editorRef.current) editorRef.current.innerHTML = "";
  };

  // Load Existing Note
  const handleSelectNote = (note) => {
    setActiveNote(note);
    setTitle(note.title);
    setShowPreview(false);
    setTimeout(() => {
      if (editorRef.current) editorRef.current.innerHTML = note.content;
    }, 0);
  };

  // Formatting Function (ExecCommand)
  const formatText = (command, value = null) => {
    if (!showPreview) {
      document.execCommand(command, false, value);
      editorRef.current.focus();
    }
  };

  // Save Note to Firebase
  const handleSave = async () => {
    if (!title.trim()) return toast.error("Please enter a title");
    const content = editorRef.current.innerHTML;
    if (!content.trim() || content === "<br>") return toast.error("Note content is empty");

    const noteData = { title, content };

    try {
      if (activeNote) {
        await updateNote(activeNote.id, noteData);
        toast.success("Note updated successfully");
      } else {
        const newId = await saveNote(noteData);
        setActiveNote({ id: newId, ...noteData });
        toast.success("New note saved");
      }
      fetchNotes();
    } catch (error) {
      toast.error("Failed to save note");
    }
  };

  // Delete Note
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    try {
      await deleteNote(id);
      toast.success("Note deleted");
      if (activeNote?.id === id) handleNewNote();
      fetchNotes();
    } catch (error) {
      toast.error("Failed to delete note");
    }
  };

  // Print Note
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 animate-in fade-in h-[calc(100vh-100px)] flex gap-6">
      
      {/* Print Styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 40px; background: white; color: black; }
          .no-print { display: none !important; }
        }
        /* Editor base styles */
        .editor-area h1 { font-size: 2em; font-weight: bold; margin-bottom: 0.5em; }
        .editor-area h2 { font-size: 1.5em; font-weight: bold; margin-bottom: 0.5em; }
        .editor-area h3 { font-size: 1.17em; font-weight: bold; margin-bottom: 0.5em; }
        .editor-area ul { list-style-type: disc; margin-left: 20px; }
        .editor-area ol { list-style-type: decimal; margin-left: 20px; }
      `}</style>

      {/* --- SIDEBAR: Note List --- */}
      <div className="w-1/3 max-w-sm bg-white dark:bg-[#1a2235] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col no-print hidden md:flex">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h2 className="font-bold text-lg text-slate-800 dark:text-white">My Notebook</h2>
          <button onClick={handleNewNote} className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors">
            <Plus className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-2 space-y-2 custom-scrollbar">
          {notes.map(note => (
            <div 
              key={note.id} 
              onClick={() => handleSelectNote(note)}
              className={`p-3 rounded-xl cursor-pointer transition-colors flex justify-between items-center group border ${activeNote?.id === note.id ? "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800/50" : "hover:bg-slate-50 dark:hover:bg-[#1e293b] border-transparent"}`}
            >
              <div className="truncate pr-4">
                <h3 className={`font-bold truncate ${activeNote?.id === note.id ? "text-blue-700 dark:text-blue-400" : "text-slate-700 dark:text-slate-300"}`}>{note.title}</h3>
                <p className="text-xs text-slate-400 truncate">Last updated: {note.updatedAt?.toDate().toLocaleDateString()}</p>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }}
                className="opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 p-1.5 rounded transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {notes.length === 0 && <p className="text-center text-slate-400 text-sm mt-10">No notes found.</p>}
        </div>
      </div>

      {/* --- MAIN AREA: Editor --- */}
      <div className="flex-1 bg-white dark:bg-[#1a2235] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col overflow-hidden">
        
        {/* Top Header Actions */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap gap-4 justify-between items-center bg-slate-50 dark:bg-[#0f172a] no-print">
          <input 
            type="text" 
            placeholder="Note Title..." 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 min-w-[200px] text-lg font-bold bg-transparent border-none focus:ring-0 text-slate-900 dark:text-white placeholder:text-slate-400"
          />
          <div className="flex gap-2">
            <button onClick={() => setShowPreview(!showPreview)} className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-white rounded-lg font-medium transition-colors">
              {showPreview ? <><Edit3 className="w-4 h-4"/> Edit</> : <><Eye className="w-4 h-4"/> Preview</>}
            </button>
            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-slate-800 dark:bg-slate-600 hover:bg-black text-white rounded-lg font-medium transition-colors">
              <Printer className="w-4 h-4"/> Print
            </button>
            <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition-colors shadow-md">
              <Save className="w-4 h-4"/> Save
            </button>
          </div>
        </div>

        {/* Toolbar (Hidden in Preview) */}
        {!showPreview && (
          <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-[#1e293b] flex flex-wrap items-center gap-2 no-print">
            
            {/* Fonts */}
            <select onChange={(e) => formatText("fontName", e.target.value)} className="p-2 bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium dark:text-white cursor-pointer outline-none">
              <option value="">Select Font</option>
              {FONTS.map(f => <option key={f.name} value={f.value}>{f.name}</option>)}
            </select>

            {/* Headings */}
            <select onChange={(e) => formatText("formatBlock", e.target.value)} className="p-2 bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium dark:text-white cursor-pointer outline-none">
              <option value="P">Paragraph</option>
              <option value="H1">Heading 1</option>
              <option value="H2">Heading 2</option>
              <option value="H3">Heading 3</option>
            </select>

            <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></div>

            {/* Color Picker */}
            <div className="relative flex items-center justify-center w-10 h-10 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <Palette className="w-5 h-5 text-slate-600 dark:text-slate-300 absolute pointer-events-none" />
              <input type="color" onChange={(e) => formatText("foreColor", e.target.value)} className="opacity-0 cursor-pointer w-full h-full" title="Text Color" />
            </div>

            <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></div>

            {/* Text Styles */}
            <button onClick={() => formatText("bold")} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 transition-colors"><Bold className="w-5 h-5"/></button>
            <button onClick={() => formatText("italic")} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 transition-colors"><Italic className="w-5 h-5"/></button>
            <button onClick={() => formatText("underline")} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 transition-colors"><Underline className="w-5 h-5"/></button>
            
            <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></div>

            {/* Alignment */}
            <button onClick={() => formatText("justifyLeft")} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 transition-colors"><AlignLeft className="w-5 h-5"/></button>
            <button onClick={() => formatText("justifyCenter")} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 transition-colors"><AlignCenter className="w-5 h-5"/></button>
            <button onClick={() => formatText("justifyRight")} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 transition-colors"><AlignRight className="w-5 h-5"/></button>
            <button onClick={() => formatText("justifyFull")} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 transition-colors"><AlignJustify className="w-5 h-5"/></button>
            
            <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></div>

            {/* Lists */}
            <button onClick={() => formatText("insertUnorderedList")} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 transition-colors"><List className="w-5 h-5"/></button>
            <button onClick={() => formatText("insertOrderedList")} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 transition-colors"><ListOrdered className="w-5 h-5"/></button>
          </div>
        )}

        {/* Editor / Preview Area */}
        <div id="print-area" className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-[#0f172a]/50 relative">
          
          {/* Print Header (Only visible during print) */}
          <div className="hidden print:block text-center mb-8 border-b-2 border-black pb-4">
            <h1 className="text-3xl font-bold font-serif uppercase tracking-widest">Western School & College</h1>
            <h2 className="text-xl font-bold mt-2">{title || "Untitled Document"}</h2>
          </div>

          <div 
            ref={editorRef}
            contentEditable={!showPreview}
            className={`editor-area min-h-[400px] outline-none text-slate-800 dark:text-slate-200 leading-relaxed ${showPreview ? "cursor-default" : "cursor-text"}`}
            placeholder={showPreview ? "" : "Start typing your note here..."}
            style={{ 
              fontFamily: 'Arial, sans-serif', 
              fontSize: '16px' 
            }}
          />
        </div>

      </div>
    </div>
  );
}