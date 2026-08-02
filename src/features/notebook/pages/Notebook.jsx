import React, { useState, useEffect, useRef } from "react";
import { getNotes, saveNote, updateNote, deleteNote } from "../services/notebookService";
import { 
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify, 
  List, ListOrdered, Save, Printer, Trash2, Plus, Eye, Edit3, Palette,
  Table, LayoutTemplate, Calendar, Calculator, X, Equal, Keyboard, 
  Code, Download, FileImage, Copy, Type, PenTool, Edit
} from "lucide-react";
import toast from "react-hot-toast";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const FONTS = [
  { name: "Default (Sans)", value: "Arial, sans-serif" },
  { name: "Arial Black", value: "'Arial Black', sans-serif" },
  { name: "Bahnschrift", value: "'Bahnschrift', sans-serif" },
  { name: "Bangla", value: "'Bangla', sans-serif" },
  { name: "BenSenHandwriting", value: "'BenSenHandwriting', sans-serif" },
  { name: "BijoyMJ", value: "'BijoyMJ', sans-serif" },
  { name: "Bookman Old Style", value: "'Bookman Old Style', serif" },
  { name: "Calibri", value: "'calibri', sans-serif" },
  { name: "Candara", value: "'Candara', sans-serif" },
  { name: "Consolas", value: "'consolas', monospace" },
  { name: "Courier New", value: "'Courier New', monospace" },
  { name: "Ebrima", value: "'Ebrima', sans-serif" },
  { name: "Georgia", value: "'Georgia', serif" },
  { name: "Impact", value: "'Impact', sans-serif" },
  { name: "Kalpurush (Bangla)", value: "'kalpurush', sans-serif" },
  { name: "Segoe UI", value: "'Segoe UI', sans-serif" },
  { name: "Times New Roman", value: "'times', serif" },
  { name: "Trebuchet MS", value: "'Trebuchet MS', sans-serif" },
  { name: "Verdana", value: "'Verdana', sans-serif" }
];

const MATH_SYMBOLS = ["∑", "∫", "√", "∞", "≈", "≠", "≤", "≥", "α", "β", "π", "θ", "μ", "Δ", "Ω", "±", "×", "÷"];

export default function Notebook() {
  const [notes, setNotes] = useState([]);
  const [activeNote, setActiveNote] = useState(null);
  const [title, setTitle] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [toolbarTab, setToolbarTab] = useState("write"); 
  
  const [showCalc, setShowCalc] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [calcInput, setCalcInput] = useState("");
  
  const [pageOrientation, setPageOrientation] = useState("portrait");
  const [borderStyle, setBorderStyle] = useState("none"); 
  const [borderColor, setBorderColor] = useState("#334155");
  const [margins, setMargins] = useState({ top: 40, bottom: 40, left: 40, right: 40 });
  const [pageBgColor, setPageBgColor] = useState("#ffffff");
  const [pageGradient, setPageGradient] = useState("none");
  const [pageColumns, setPageColumns] = useState(1);
  const [watermark, setWatermark] = useState("");
  
  const [fontSize, setFontSize] = useState("16");
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  const [savedTemplates, setSavedTemplates] = useState([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templatePlaceholders, setTemplatePlaceholders] = useState([]);
  const [templateInputs, setTemplateInputs] = useState({});
  const [pendingTemplateHtml, setPendingTemplateHtml] = useState("");

  const [showTableModal, setShowTableModal] = useState(false);
  const [tableConfig, setTableConfig] = useState({ rows: 3, cols: 3, style: "1" });

  const editorRef = useRef(null);

  useEffect(() => {
    fetchNotes();
    const localTemplates = localStorage.getItem("notebook_templates");
    if (localTemplates) {
      try { setSavedTemplates(JSON.parse(localTemplates)); } catch(e){}
    }
  }, []);

  const fetchNotes = async () => {
    try {
      const data = await getNotes();
      setNotes(data);
    } catch (error) {
      toast.error("Failed to load notes");
    }
  };

  const handleNewNote = () => {
    setActiveNote(null);
    setTitle("");
    setShowPreview(false);
    resetPageSetup();
    if (editorRef.current) {
      editorRef.current.innerHTML = "";
      updateCounts();
    }
  };

  const resetPageSetup = () => {
    setPageOrientation("portrait");
    setBorderStyle("none");
    setMargins({ top: 40, bottom: 40, left: 40, right: 40 });
    setPageBgColor("#ffffff");
    setPageGradient("none");
    setPageColumns(1);
    setWatermark("");
  };

  const handleSelectNote = (note) => {
    setActiveNote(note);
    setTitle(note.title);
    setShowPreview(false);
    
    if (note.settings) {
      setPageOrientation(note.settings.pageOrientation || "portrait");
      setBorderStyle(note.settings.borderStyle || "none");
      setBorderColor(note.settings.borderColor || "#334155");
      setMargins(note.settings.margins || { top: 40, bottom: 40, left: 40, right: 40 });
      setPageBgColor(note.settings.pageBgColor || "#ffffff");
      setPageGradient(note.settings.pageGradient || "none");
      setPageColumns(note.settings.pageColumns || 1);
      setWatermark(note.settings.watermark || "");
    } else {
      resetPageSetup();
    }

    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = note.content;
        updateCounts();
      }
    }, 0);
  };

  const updateCounts = () => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText || "";
    setCharCount(text.length);
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    setWordCount(words.length);
  };

  const formatText = (command, value = null) => {
    if (!showPreview) {
      document.execCommand(command, false, value);
      editorRef.current.focus();
      updateCounts();
    }
  };

  const insertHTMLAtCursor = (html) => {
    if (showPreview) return;
    editorRef.current.focus();
    document.execCommand('insertHTML', false, html + '<p>&#8203;</p>');
    updateCounts();
  };

  const applyCustomFontSize = () => {
    let size = parseInt(fontSize);
    if (isNaN(size) || size < 1) size = 1;
    if (size > 200) size = 200;
    setFontSize(size.toString());

    if (!showPreview && editorRef.current) {
      document.execCommand("styleWithCSS", false, true);
      document.execCommand("fontSize", false, "7"); 
      const fonts = editorRef.current.querySelectorAll('font[size="7"]');
      fonts.forEach(font => {
        font.removeAttribute("size");
        font.style.fontSize = `${size}px`;
      });
      const spans = editorRef.current.querySelectorAll('span[style*="-webkit-xxx-large"]');
      spans.forEach(span => { span.style.fontSize = `${size}px`; });
      editorRef.current.focus();
      updateCounts();
    }
  };

  // --- FIXED: Enter / Shift+Enter inside text boxes ---
  const handleKeyDown = (e) => {
    updateCounts();

    // Auto math evaluation (existing)
    if (e.key === '=') {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const node = selection.focusNode;
        if (node.nodeType === 3) { 
          const text = node.textContent;
          const match = text.match(/([\d\.\s\+\-\*\/\(\)]+)=$/);
          if (match) {
            try {
              // eslint-disable-next-line no-eval
              const result = eval(match[1]); 
              if (result !== undefined && !isNaN(result)) {
                setTimeout(() => document.execCommand("insertText", false, `${result}`), 10);
              }
            } catch (err) {}
          }
        }
      }
    }

    // ---- Custom Enter behavior for textbox-block ----
    if (e.key === 'Enter') {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const node = selection.anchorNode;
        const textbox = node.parentElement?.closest('.textbox-block');
        if (textbox) {
          e.preventDefault();
          if (e.shiftKey) {
            // Shift+Enter: clone the whole textbox and insert after
            const clone = textbox.cloneNode(true);
            // Clear clone content but keep the structure; you can set a default placeholder
            clone.innerHTML = '<p><br></p>';
            // Insert after current textbox
            textbox.parentNode.insertBefore(clone, textbox.nextSibling);
            // Move cursor into the clone
            const newRange = document.createRange();
            newRange.selectNodeContents(clone);
            newRange.collapse(false);
            selection.removeAllRanges();
            selection.addRange(newRange);
          } else {
            // Just Enter: insert a line break (<br>)
            document.execCommand('insertLineBreak');
          }
          updateCounts();
          return;
        }
      }
    }

    // Keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      const shortcutMap = { 'b': 'bold', 'i': 'italic', 'u': 'underline', 'l': 'justifyLeft', 'e': 'justifyCenter', 'r': 'justifyRight', 'j': 'justifyFull' };
      if (shortcutMap[e.key.toLowerCase()]) {
        e.preventDefault(); 
        formatText(shortcutMap[e.key.toLowerCase()]);
      }
    }
  };

  const insertList = (type) => {
    let listStyle = "disc"; let tag = "ul";
    if (type === "number") { listStyle = "decimal"; tag = "ol"; }
    else if (type === "abc") { listStyle = "lower-alpha"; tag = "ol"; }
    else if (type === "roman") { listStyle = "lower-roman"; tag = "ol"; }
    else if (type === "bengali") { listStyle = "bengali"; tag = "ol"; }
    else if (type === "icon1") { listStyle = "square"; }
    else if (type === "icon2") { listStyle = "circle"; }
    insertHTMLAtCursor(`<${tag} style="list-style-type: ${listStyle}; margin-left: 20px;"><li>List Item</li></${tag}>`);
  };

  const insertHeader = (style) => {
    const engName = `<h1 style="margin: 0; font-size: 26px; color: #1e3a8a; font-family: 'Anton', sans-serif; text-transform: uppercase;">Western School & College</h1>`;
    const bnName = `<h2 style="margin: 5px 0; font-size: 20px; color: #1d4ed8; font-family: 'kalpurush', sans-serif;">ওয়েস্টার্ন স্কুল এন্ড কলেজ</h2>`;
    const engAddr = `<p style="margin: 5px 0 0 0; font-size: 14px; color: #334155;">Didar Market, Dewan Bazar, Chattogram.</p>`;
    const bnAddr = `<p style="margin: 0; font-size: 14px; color: #334155; font-family: 'kalpurush', sans-serif;">দিদার মার্কেট, দেওয়ান বাজার, চট্টগ্রাম।</p>`;
    const logo = `<img src="/logo.png" style="width: 80px; height: 80px; display: block; margin: 0 auto 10px auto;" alt="Logo" />`;
    
    const wrapper = (content) => `<div contenteditable="false" style="text-align: center; background-color: #eff6ff; padding: 20px; border-bottom: 3px solid #1d4ed8; margin-bottom: 20px; font-family: 'Arial', sans-serif; border-radius: 8px 8px 0 0;">${content}</div>`;
    
    let html = "";
    if (style === "combined") html = wrapper(logo + engName + bnName + engAddr + bnAddr);
    else if (style === "eng_addr") html = wrapper(logo + engName + engAddr);
    else if (style === "eng_no_addr") html = wrapper(logo + engName);
    else if (style === "bn_addr") html = wrapper(logo + bnName + bnAddr);
    else if (style === "bn_no_addr") html = wrapper(logo + bnName);
    
    if(html) insertHTMLAtCursor(html);
  };

  const insertDate = (lang) => {
    const now = new Date();
    let dateStr = lang === 'en' ? now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : now.toLocaleDateString('bn-BD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    insertHTMLAtCursor(`<strong>${dateStr}</strong>`);
  };

  const insertCustomTable = () => {
    let borderStyle = "1px solid #cbd5e1"; let headerBg = "#f8fafc"; let rowBg = "";
    if (tableConfig.style === "2") { headerBg = "#1e293b"; borderStyle = "1px solid #334155"; }
    if (tableConfig.style === "3") { headerBg = "#eff6ff"; borderStyle = "1px solid #bfdbfe"; }
    if (tableConfig.style === "4") { headerBg = "transparent"; borderStyle = "1px solid #000"; }
    if (tableConfig.style === "5") { headerBg = "transparent"; borderStyle = "0"; rowBg = "border-bottom: 1px solid #ccc;"; }

    let html = `<table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; text-align: left;" border="${tableConfig.style === '5' ? '0' : '1'}" cellpadding="8"><thead><tr style="background-color: ${headerBg}; color: ${tableConfig.style === '2' ? '#fff' : '#000'};">`;
    for(let c=0; c<tableConfig.cols; c++) html += `<th style="border: ${borderStyle};">Header ${c+1}</th>`;
    html += `</tr></thead><tbody>`;
    for(let r=0; r<tableConfig.rows; r++) {
      html += `<tr style="${rowBg}">`;
      for(let c=0; c<tableConfig.cols; c++) html += `<td style="border: ${borderStyle};"><br></td>`;
      html += `</tr>`;
    }
    html += `</tbody></table><p><br></p>`;
    insertHTMLAtCursor(html);
    setShowTableModal(false);
  };

  // --- FIXED: textbox now includes class 'textbox-block' ---
  const insertTextBox = (type) => {
    let styles = "padding: 15px; margin: 15px 0; border-radius: 8px; font-family: sans-serif; display: block;";
    if (type === 'info') styles += "background-color: #eff6ff; border-left: 5px solid #3b82f6; color: #1e3a8a;";
    if (type === 'success') styles += "background-color: #f0fdf4; border-left: 5px solid #22c55e; color: #14532d;";
    if (type === 'warning') styles += "background-color: #fefce8; border-left: 5px solid #eab308; color: #713f12;";
    if (type === 'danger') styles += "background-color: #fef2f2; border-left: 5px solid #ef4444; color: #7f1d1d;";
    if (type === 'quote') styles += "background-color: #f8fafc; border-left: 5px solid #94a3b8; color: #334155; font-style: italic;";
    insertHTMLAtCursor(`<div class="textbox-block" style="${styles}"><strong>${type.toUpperCase()}:</strong> Type your text here...</div>`);
  };

  // Signature now includes crossOrigin="anonymous" for PDF export
  const insertSignature = (lang) => {
    const isBn = lang === 'bn';
    const dateStr = isBn ? new Date().toLocaleDateString('bn-BD') : new Date().toLocaleDateString('en-GB');
    const name = isBn ? "ফজলুল করিম" : "Fazlul Karim";
    const titleText = isBn ? "অধ্যক্ষ" : "Principal";
    const schoolText = isBn ? "ওয়েস্টার্ন স্কুল এন্ড কলেজ" : "Western School and College";
    const dateLabel = isBn ? "তারিখ:" : "Date:";

    const html = `
      <div style="margin-top: 40px; display: inline-block; text-align: center; float: right; font-family: 'kalpurush', Arial, sans-serif;">
        <img src="https://res.cloudinary.com/do1dejkkk/image/upload/v1776331870/principal_sign-removebg-preview_pj4jrj.png"
             crossOrigin="anonymous"
             style="height: 50px; object-fit: contain; margin-bottom: 5px;" alt="Sign" />
        <div style="border-top: 1px solid #000; padding-top: 5px; font-weight: bold;">${name}</div>
        <div style="font-size: 13px; color: #333;">${titleText}</div>
        <div style="font-size: 13px; color: #333;">${schoolText}</div>
        <div style="font-size: 12px; color: #555; margin-top: 5px;">${dateLabel} ${dateStr}</div>
      </div><div style="clear: both;"></div><p><br></p>`;
    insertHTMLAtCursor(html);
  };

  const saveAsTemplate = () => {
    const content = editorRef.current.innerHTML;
    const newTemplate = { id: Date.now(), name: title || `Template ${savedTemplates.length + 1}`, html: content };
    const updated = [...savedTemplates, newTemplate];
    setSavedTemplates(updated);
    localStorage.setItem("notebook_templates", JSON.stringify(updated));
    toast.success("Saved as Template!");
  };

  const deleteTemplate = (id) => {
    const updated = savedTemplates.filter(t => t.id !== id);
    setSavedTemplates(updated);
    localStorage.setItem("notebook_templates", JSON.stringify(updated));
    toast.success("Template deleted!");
  };

  const loadTemplateToEdit = (t) => {
    if(editorRef.current) {
      editorRef.current.innerHTML = t.html;
      setTitle(t.name);
      updateCounts();
      toast.success("Template loaded for editing!");
    }
  };

  const applyTemplate = (template) => {
    const regex = /\{([^}]+)\}/g;
    const placeholders = [];
    let match;
    while ((match = regex.exec(template.html)) !== null) {
      if (!placeholders.includes(match[1])) placeholders.push(match[1]);
    }
    if (placeholders.length > 0) {
      setTemplatePlaceholders(placeholders);
      setPendingTemplateHtml(template.html);
      setTemplateInputs({});
      setShowTemplateModal(true);
    } else {
      insertHTMLAtCursor(template.html);
    }
  };

  const submitTemplateValues = () => {
    let finalHtml = pendingTemplateHtml;
    templatePlaceholders.forEach(ph => {
      const value = templateInputs[ph] || "";
      const regex = new RegExp(`\\{${ph}\\}`, 'g');
      finalHtml = finalHtml.replace(regex, value);
    });
    insertHTMLAtCursor(finalHtml);
    setShowTemplateModal(false);
  };

  const handlePrint = () => {
    document.title = title || "Document";
    window.print();
  };

  // --- FIXED: PDF export with column reset and crossOrigin support ---
  const exportPDF = async () => {
    const element = document.querySelector('.page-container');
    if (!element) return;

    // Reset columns for reliable capture
    const originalColumnCount = element.style.columnCount || 
      getComputedStyle(element).columnCount;
    const originalColumnGap = element.style.columnGap || 
      getComputedStyle(element).columnGap;
    element.style.columnCount = '1';
    element.style.columnGap = '0';
    
    const loadingToast = toast.loading("Generating PDF...");
    try {
      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: '#ffffff',
        allowTaint: false
      });
      const imgData = canvas.toDataURL("image/jpeg", 1.0);
      
      const pdf = new jsPDF({
        orientation: pageOrientation,
        unit: "mm",
        format: "a4"
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${title || "Document"}.pdf`);
      toast.success("PDF Downloaded!", { id: loadingToast });
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate PDF.", { id: loadingToast });
    } finally {
      // Restore original column settings
      element.style.columnCount = originalColumnCount;
      element.style.columnGap = originalColumnGap;
    }
  };
  
  // --- FIXED: Image export with column reset ---
  const exportImage = async () => {
    const element = document.querySelector('.page-container');
    if (!element) return;
    
    const originalColumnCount = element.style.columnCount || 
      getComputedStyle(element).columnCount;
    const originalColumnGap = element.style.columnGap || 
      getComputedStyle(element).columnGap;
    element.style.columnCount = '1';
    element.style.columnGap = '0';
    
    const loadingToast = toast.loading("Generating Image...");
    try {
      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: '#ffffff',
        allowTaint: false
      });
      const link = document.createElement("a");
      link.download = `${title || 'Document'}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Image Downloaded!", { id: loadingToast });
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate image.", { id: loadingToast });
    } finally {
      element.style.columnCount = originalColumnCount;
      element.style.columnGap = originalColumnGap;
    }
  };

  const evalCalc = () => {
    try {
      // eslint-disable-next-line no-eval
      setCalcInput(eval(calcInput).toString());
    } catch {
      setCalcInput("Error");
    }
  };

  const handleSave = async () => {
    if (!title.trim()) return toast.error("Please enter a title");
    const content = editorRef.current.innerHTML;
    if (!content.trim() || content === "<br>") return toast.error("Note content is empty");

    const noteData = { 
      title, content, 
      settings: { pageOrientation, borderStyle, borderColor, margins, pageBgColor, pageGradient, pageColumns, watermark } 
    };

    try {
      if (activeNote) {
        await updateNote(activeNote.id, noteData);
        toast.success("Note updated");
      } else {
        const newId = await saveNote(noteData);
        setActiveNote({ id: newId, ...noteData });
        toast.success("Note saved");
      }
      fetchNotes();
    } catch (error) {
      toast.error("Failed to save note");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteNote(deleteTarget);
      toast.success("Note deleted");
      setShowDeleteModal(false);
      if (activeNote?.id === deleteTarget) handleNewNote();
      fetchNotes();
    } catch (error) {
      toast.error("Failed to delete note");
    }
  };

  const getCode = (type) => {
    const html = editorRef.current?.innerHTML || "";
    if (type === 'html') return html;
    return `<div className="notebook-content"\n  dangerouslySetInnerHTML={{ __html: \`${html.replace(/`/g, "\\`")}\` }}\n/>`;
  };

  const bgStyle = pageGradient !== "none" ? { background: pageGradient } : { backgroundColor: pageBgColor };

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-6 animate-in fade-in h-[calc(100vh-80px)] flex flex-col lg:flex-row gap-6 relative">
      
      {/* Dynamic CSS for Print & Editor layout – print margins fixed */}
      <style>{`
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
          }
          body * { visibility: hidden; }
          #print-area-wrapper, #print-area-wrapper * { visibility: visible; }
          #print-area-wrapper { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; }
          .no-print { display: none !important; }
          @page { size: A4 ${pageOrientation}; margin: 0mm; }
          .page-container {
            width: 100% !important; max-width: 100% !important; margin: 0 auto !important;
            box-shadow: none !important; min-height: 100vh !important;
            page-break-after: avoid;
          }
        }
        .editor-area h1 { font-size: 2.5em; font-weight: bold; margin-bottom: 0.5em; }
        .editor-area h2 { font-size: 2em; font-weight: bold; margin-bottom: 0.5em; }
        .editor-area h3 { font-size: 1.5em; font-weight: bold; margin-bottom: 0.5em; }
        .editor-area h4 { font-size: 1.2em; font-weight: bold; margin-bottom: 0.5em; }
        .editor-area p { margin-bottom: 0.5em; }
        
        .page-container {
          width: ${pageOrientation === 'portrait' ? '794px' : '1123px'};
          min-height: ${pageOrientation === 'portrait' ? '1123px' : '794px'};
          box-shadow: 0 10px 25px rgba(0,0,0,0.4);
          border-style: ${borderStyle};
          border-width: ${borderStyle !== 'none' ? '4px' : '0'};
          border-color: ${borderColor};
          padding: ${margins.top}px ${margins.right}px ${margins.bottom}px ${margins.left}px;
          margin: 0 auto;
          position: relative;
          overflow: hidden;
        }

        .watermark-overlay {
          position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 80px; font-weight: bold; color: rgba(0,0,0,0.05);
          pointer-events: none; white-space: nowrap; z-index: 0;
        }

        .editor-area {
          column-count: ${pageColumns};
          column-gap: 40px;
          min-height: 100%;
          position: relative;
          z-index: 1;
        }
      `}</style>

      {/* --- SIDEBAR --- */}
      <div className="w-1/4 max-w-[280px] bg-[#1a2235] border border-slate-800 rounded-2xl shadow-sm flex flex-col no-print hidden lg:flex">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h2 className="font-bold text-lg text-white">Notebook</h2>
          <button onClick={handleNewNote} className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"><Plus className="w-4 h-4" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-3 space-y-2 custom-scrollbar">
          {notes.map(note => (
            <div key={note.id} onClick={() => handleSelectNote(note)} className={`p-3 rounded-xl cursor-pointer transition-colors flex justify-between items-center group border ${activeNote?.id === note.id ? "bg-blue-900/40 border-blue-800/50" : "hover:bg-[#1e293b] border-transparent"}`}>
              <div className="truncate pr-4">
                <h3 className={`font-bold text-sm truncate ${activeNote?.id === note.id ? "text-blue-400" : "text-slate-300"}`}>{note.title}</h3>
              </div>
              <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(note.id); setShowDeleteModal(true); }} className="opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-900/30 p-1.5 rounded transition-all"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </div>

      {/* --- MAIN AREA --- */}
      <div className="flex-1 bg-[#0f172a] border border-slate-800 rounded-2xl shadow-inner flex flex-col overflow-hidden relative">
        
        {/* Top Actions */}
        <div className="p-4 border-b border-slate-800 flex flex-wrap gap-4 justify-between items-center bg-[#1a2235] no-print z-10">
          <input type="text" placeholder="Document Title..." value={title} onChange={(e) => setTitle(e.target.value)} className="flex-1 min-w-[200px] text-lg font-bold bg-transparent border-none focus:ring-0 text-white placeholder:text-slate-500" />
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowShortcuts(true)} className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"><Keyboard className="w-4 h-4"/></button>
            <button onClick={() => setShowCodeModal(true)} className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"><Code className="w-4 h-4"/></button>
            <button onClick={exportImage} className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"><FileImage className="w-4 h-4"/></button>
            <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium"><Download className="w-4 h-4"/> PDF</button>
            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium"><Printer className="w-4 h-4"/> Print</button>
            <button onClick={() => setShowPreview(!showPreview)} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium">{showPreview ? <><Edit3 className="w-4 h-4"/> Edit</> : <><Eye className="w-4 h-4"/> Preview</>}</button>
            <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold"><Save className="w-4 h-4"/> Save</button>
          </div>
        </div>

        {/* Toolbar Tabs */}
        {!showPreview && (
          <div className="bg-[#1e293b] border-b border-slate-700 flex px-4 no-print">
            <button onClick={() => setToolbarTab("write")} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${toolbarTab === 'write' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400'}`}>Write</button>
            <button onClick={() => setToolbarTab("insert")} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${toolbarTab === 'insert' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400'}`}>Insert</button>
            <button onClick={() => setToolbarTab("setup")} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${toolbarTab === 'setup' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400'}`}>Page Setup</button>
            <button onClick={() => setToolbarTab("advanced")} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${toolbarTab === 'advanced' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400'}`}>Templates</button>
          </div>
        )}

        {/* Toolbar Content */}
        {!showPreview && (
          <div className="p-3 border-b border-slate-800 bg-[#1e293b] flex flex-wrap items-center gap-2 no-print z-10 shadow-sm min-h-[60px]">
            
            {/* WRITE TAB */}
            {toolbarTab === "write" && (
              <>
                <select onChange={(e) => formatText("fontName", e.target.value)} className="p-2 bg-[#0f172a] border border-slate-700 rounded-lg text-sm text-white outline-none w-36">
                  <option value="" className="text-black bg-white">Font Family</option>
                  {FONTS.map(f => <option key={f.name} value={f.value} className="text-black bg-white">{f.name}</option>)}
                </select>

                <div className="flex items-center bg-[#0f172a] border border-slate-700 rounded-lg overflow-hidden">
                  <span className="pl-2 text-slate-400"><Type className="w-3 h-3"/></span>
                  <input type="number" min="1" max="200" value={fontSize} onChange={(e) => setFontSize(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && applyCustomFontSize()} onBlur={applyCustomFontSize} className="w-14 p-2 bg-transparent text-sm text-white outline-none text-center" />
                </div>

                <select onChange={(e) => formatText("formatBlock", e.target.value)} className="p-2 bg-[#0f172a] border border-slate-700 rounded-lg text-sm text-white outline-none w-24">
                  <option value="P" className="text-black bg-white">Normal</option>
                  <option value="H1" className="text-black bg-white">Title H1</option>
                  <option value="H2" className="text-black bg-white">Title H2</option>
                  <option value="H3" className="text-black bg-white">Heading 3</option>
                </select>

                <div className="relative flex items-center justify-center w-9 h-9 rounded-lg hover:bg-slate-700 border border-slate-700 bg-[#0f172a]">
                  <Palette className="w-4 h-4 text-slate-300 absolute pointer-events-none" />
                  <input type="color" onChange={(e) => formatText("foreColor", e.target.value)} className="opacity-0 cursor-pointer w-full h-full" />
                </div>

                <div className="flex bg-[#0f172a] rounded-lg border border-slate-700 p-0.5 mx-1">
                  <button onClick={() => formatText("bold")} className="p-2 hover:bg-slate-700 rounded-md text-slate-300"><Bold className="w-4 h-4"/></button>
                  <button onClick={() => formatText("italic")} className="p-2 hover:bg-slate-700 rounded-md text-slate-300"><Italic className="w-4 h-4"/></button>
                  <button onClick={() => formatText("underline")} className="p-2 hover:bg-slate-700 rounded-md text-slate-300"><Underline className="w-4 h-4"/></button>
                </div>
                
                <div className="flex bg-[#0f172a] rounded-lg border border-slate-700 p-0.5 mx-1">
                  <button onClick={() => formatText("justifyLeft")} className="p-2 hover:bg-slate-700 rounded-md text-slate-300"><AlignLeft className="w-4 h-4"/></button>
                  <button onClick={() => formatText("justifyCenter")} className="p-2 hover:bg-slate-700 rounded-md text-slate-300"><AlignCenter className="w-4 h-4"/></button>
                  <button onClick={() => formatText("justifyRight")} className="p-2 hover:bg-slate-700 rounded-md text-slate-300"><AlignRight className="w-4 h-4"/></button>
                  <button onClick={() => formatText("justifyFull")} className="p-2 hover:bg-slate-700 rounded-md text-slate-300"><AlignJustify className="w-4 h-4"/></button>
                </div>

                <select onChange={(e) => { if(e.target.value) insertList(e.target.value); e.target.value=""; }} className="p-2 bg-[#0f172a] border border-slate-700 rounded-lg text-sm text-white outline-none w-28 ml-1">
                  <option value="" className="text-black bg-white">+ Bullet</option>
                  <option value="number" className="text-black bg-white">1, 2, 3...</option>
                  <option value="abc" className="text-black bg-white">a, b, c...</option>
                  <option value="roman" className="text-black bg-white">i, ii, iii...</option>
                  <option value="bengali" className="text-black bg-white">ক, খ, গ...</option>
                  <option value="icon1" className="text-black bg-white">■ Square</option>
                  <option value="icon2" className="text-black bg-white">○ Circle</option>
                </select>
              </>
            )}

            {/* INSERT TAB */}
            {toolbarTab === "insert" && (
              <>
                <select onChange={(e) => { if(e.target.value) insertHeader(e.target.value); e.target.value=""; }} className="p-2 bg-blue-900/30 border border-blue-800 text-blue-300 rounded-lg text-sm outline-none cursor-pointer">
                  <option value="" className="text-black bg-white">+ Header</option>
                  <option value="combined" className="text-black bg-white">En+Bn with Address</option>
                  <option value="eng_addr" className="text-black bg-white">English with Address</option>
                  <option value="eng_no_addr" className="text-black bg-white">English without Address</option>
                  <option value="bn_addr" className="text-black bg-white">Bengali with Address</option>
                  <option value="bn_no_addr" className="text-black bg-white">Bengali without Address</option>
                </select>

                <select onChange={(e) => { if(e.target.value) insertTextBox(e.target.value); e.target.value=""; }} className="p-2 bg-indigo-900/30 border border-indigo-800 text-indigo-300 rounded-lg text-sm outline-none cursor-pointer mx-2">
                  <option value="" className="text-black bg-white">+ Text Box / Alert</option>
                  <option value="info" className="text-black bg-white">Info Box (Blue)</option>
                  <option value="success" className="text-black bg-white">Success Box (Green)</option>
                  <option value="warning" className="text-black bg-white">Warning Box (Yellow)</option>
                  <option value="danger" className="text-black bg-white">Danger Box (Red)</option>
                  <option value="quote" className="text-black bg-white">Quote Block (Gray)</option>
                </select>

                <button onClick={() => setShowTableModal(true)} className="px-3 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-lg text-sm border border-slate-700 flex items-center gap-1"><Table className="w-4 h-4"/> Table</button>
                
                <select onChange={(e) => { if(e.target.value) insertSignature(e.target.value); e.target.value=""; }} className="p-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-sm outline-none cursor-pointer mx-2">
                  <option value="" className="text-black bg-white">+ Principal Sign</option>
                  <option value="en" className="text-black bg-white">English (Fazlul Karim)</option>
                  <option value="bn" className="text-black bg-white">Bengali (ফজলুল করিম)</option>
                </select>
                
                <select onChange={(e) => { if(e.target.value) insertDate(e.target.value); e.target.value=""; }} className="p-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-sm outline-none cursor-pointer">
                  <option value="" className="text-black bg-white">+ Date</option>
                  <option value="en" className="text-black bg-white">English Date</option>
                  <option value="bn" className="text-black bg-white">Bengali Date</option>
                </select>

                <select onChange={(e) => { if(e.target.value) { document.execCommand("insertText", false, e.target.value); e.target.value=""; } }} className="p-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-sm outline-none cursor-pointer ml-2">
                  <option value="" className="text-black bg-white">+ Math Symbol</option>
                  {MATH_SYMBOLS.map(sym => <option key={sym} value={sym} className="text-black bg-white">{sym}</option>)}
                </select>
              </>
            )}

            {/* PAGE SETUP TAB */}
            {toolbarTab === "setup" && (
              <div className="flex gap-4 items-center w-full px-2 overflow-x-auto custom-scrollbar pb-1">
                <select value={pageOrientation} onChange={(e) => setPageOrientation(e.target.value)} className="p-2 bg-[#0f172a] border border-slate-700 rounded-lg text-sm text-white shrink-0">
                  <option value="portrait" className="text-black bg-white">A4 Portrait</option>
                  <option value="landscape" className="text-black bg-white">A4 Landscape</option>
                </select>

                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-sm text-slate-400">Cols:</span>
                  <select value={pageColumns} onChange={(e) => setPageColumns(Number(e.target.value))} className="p-2 bg-[#0f172a] border border-slate-700 rounded-lg text-sm text-white">
                    <option value={1} className="text-black bg-white">1</option><option value={2} className="text-black bg-white">2</option><option value={3} className="text-black bg-white">3</option><option value={4} className="text-black bg-white">4</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-sm text-slate-400">Border:</span>
                  <select value={borderStyle} onChange={(e) => setBorderStyle(e.target.value)} className="p-2 bg-[#0f172a] border border-slate-700 rounded-lg text-sm text-white w-20">
                    <option value="none" className="text-black bg-white">None</option><option value="solid" className="text-black bg-white">Solid</option><option value="dashed" className="text-black bg-white">Dashed</option><option value="dotted" className="text-black bg-white">Dotted</option><option value="double" className="text-black bg-white">Double</option><option value="groove" className="text-black bg-white">Groove</option>
                  </select>
                  <input type="color" value={borderColor} onChange={e => setBorderColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer shrink-0" disabled={borderStyle === 'none'}/>
                </div>

                <div className="flex items-center gap-1 bg-[#0f172a] p-1.5 rounded-lg border border-slate-700 shrink-0">
                  <span className="text-sm text-slate-400 px-1">Margin:</span>
                  <input type="number" value={margins.top} onChange={e=>setMargins({...margins, top: e.target.value})} className="w-10 bg-transparent text-white text-center text-sm outline-none" title="Top" />
                  <input type="number" value={margins.bottom} onChange={e=>setMargins({...margins, bottom: e.target.value})} className="w-10 bg-transparent text-white text-center text-sm outline-none border-l border-slate-700" title="Bottom" />
                  <input type="number" value={margins.left} onChange={e=>setMargins({...margins, left: e.target.value})} className="w-10 bg-transparent text-white text-center text-sm outline-none border-l border-slate-700" title="Left" />
                  <input type="number" value={margins.right} onChange={e=>setMargins({...margins, right: e.target.value})} className="w-10 bg-transparent text-white text-center text-sm outline-none border-l border-slate-700" title="Right" />
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-sm text-slate-400">Bg:</span>
                  <input type="color" value={pageBgColor} onChange={e => {setPageBgColor(e.target.value); setPageGradient("none");}} className="w-8 h-8 rounded cursor-pointer"/>
                  <select value={pageGradient} onChange={(e) => setPageGradient(e.target.value)} className="p-2 bg-[#0f172a] border border-slate-700 rounded-lg text-sm text-white w-24">
                    <option value="none" className="text-black bg-white">Solid</option>
                    <option value="linear-gradient(to right, #f8fafc, #e2e8f0)" className="text-black bg-white">Grad 1</option>
                    <option value="linear-gradient(to bottom right, #eff6ff, #dbeafe)" className="text-black bg-white">Grad 2</option>
                    <option value="linear-gradient(to right, #fdf4ff, #fae8ff)" className="text-black bg-white">Grad 3</option>
                  </select>
                </div>

                <input type="text" placeholder="Watermark..." value={watermark} onChange={e=>setWatermark(e.target.value)} className="w-28 p-2 bg-[#0f172a] border border-slate-700 rounded-lg text-sm text-white shrink-0"/>
              </div>
            )}

            {/* TEMPLATES TAB */}
            {toolbarTab === "advanced" && (
              <div className="flex gap-4 items-center w-full px-2 overflow-x-auto custom-scrollbar pb-1">
                <button onClick={saveAsTemplate} className="px-4 py-2 bg-emerald-900/30 text-emerald-400 rounded-lg text-sm font-bold border border-emerald-800 hover:bg-emerald-800/50 shrink-0">
                  + Save as Template
                </button>
                <div className="w-px h-6 bg-slate-700 mx-2 shrink-0"></div>
                <div className="flex gap-2">
                  {savedTemplates.length === 0 ? (
                    <span className="text-sm text-slate-500 italic">No templates saved. (Use {`{name}`} for placeholders)</span>
                  ) : (
                    savedTemplates.map(t => (
                      <div key={t.id} className="flex items-center bg-slate-800 border border-slate-700 rounded-lg overflow-hidden shrink-0">
                        <button onClick={() => applyTemplate(t)} className="px-3 py-1.5 text-white text-sm hover:bg-slate-700">{t.name}</button>
                        <button onClick={() => loadTemplateToEdit(t)} className="px-2 py-1.5 text-blue-400 hover:bg-slate-700 border-l border-slate-700" title="Edit Template"><Edit className="w-3.5 h-3.5"/></button>
                        <button onClick={() => deleteTemplate(t.id)} className="px-2 py-1.5 text-red-400 hover:bg-slate-700 border-l border-slate-700" title="Delete Template"><X className="w-3.5 h-3.5"/></button>
                      </div>
                    ))
                  )}
                </div>
                <button onClick={() => setShowCalc(!showCalc)} className={`ml-auto shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${showCalc ? 'bg-indigo-900/50 text-indigo-400' : 'bg-slate-800 text-slate-300'}`}><Calculator className="w-4 h-4"/> Calc</button>
              </div>
            )}
          </div>
        )}

        {/* --- Editor / A4 Area --- */}
        <div className="flex-1 overflow-auto bg-slate-900 flex justify-center py-10 custom-scrollbar relative">
          <div id="print-area-wrapper">
            <div id="print-container" className="page-container shrink-0 shadow-2xl" style={bgStyle}>
              {watermark && <div className="watermark-overlay">{watermark}</div>}
              <div 
                ref={editorRef}
                contentEditable={!showPreview}
                onKeyDown={handleKeyDown}
                onInput={updateCounts}
                className={`editor-area outline-none text-slate-900 leading-relaxed min-h-full ${showPreview ? "cursor-default" : "cursor-text"}`}
                placeholder={showPreview ? "" : "Write your document..."}
                style={{ fontFamily: 'Arial, sans-serif', fontSize: '16px' }}
              />
            </div>
          </div>
        </div>

        {/* Bottom Status Bar */}
        <div className="bg-[#0f172a] border-t border-slate-800 p-2 px-4 flex justify-between items-center text-xs text-slate-400 font-mono no-print">
          <div>Words: <span className="text-white font-bold">{wordCount}</span> | Characters: <span className="text-white font-bold">{charCount}</span></div>
          <div>Status: {activeNote ? 'Editing Saved Note' : 'Unsaved Draft'}</div>
        </div>

        {/* --- Calculator Widget --- */}
        {showCalc && (
          <div className="absolute top-36 right-8 w-64 bg-[#1e293b]/90 backdrop-blur-md border border-slate-700 rounded-2xl shadow-2xl p-4 animate-in slide-in-from-right-8 z-50">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-white flex items-center gap-2"><Calculator className="w-4 h-4"/> Calculator</h3>
              <button onClick={() => setShowCalc(false)} className="text-slate-400 hover:text-red-500"><X className="w-4 h-4"/></button>
            </div>
            <input type="text" value={calcInput} onChange={(e) => setCalcInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && evalCalc()} className="w-full bg-[#0f172a] text-right p-3 rounded-lg font-mono text-lg mb-3 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" />
            <div className="grid grid-cols-4 gap-2">
              {['7','8','9','/','4','5','6','*','1','2','3','-','0','.','C','+'].map((btn) => (
                <button key={btn} onClick={() => btn === 'C' ? setCalcInput("") : setCalcInput(prev => prev + btn)} className="bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-lg font-bold transition-colors">{btn}</button>
              ))}
              <button onClick={evalCalc} className="col-span-4 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg font-bold flex justify-center mt-1"><Equal className="w-5 h-5"/></button>
            </div>
          </div>
        )}
        
        {/* Table Config Modal */}
        {showTableModal && (
          <div className="absolute top-36 left-1/2 -translate-x-1/2 w-72 bg-[#1e293b]/95 backdrop-blur-md border border-slate-700 rounded-xl shadow-2xl p-5 z-50">
            <h3 className="font-bold text-white mb-4">Insert Custom Table</h3>
            <div className="flex gap-4 mb-4">
              <div><label className="text-xs text-slate-400">Rows</label><input type="number" min="1" value={tableConfig.rows} onChange={e=>setTableConfig({...tableConfig, rows: e.target.value})} className="w-full bg-[#0f172a] text-white p-2 rounded border border-slate-700"/></div>
              <div><label className="text-xs text-slate-400">Cols</label><input type="number" min="1" value={tableConfig.cols} onChange={e=>setTableConfig({...tableConfig, cols: e.target.value})} className="w-full bg-[#0f172a] text-white p-2 rounded border border-slate-700"/></div>
            </div>
            <label className="text-xs text-slate-400">Style</label>
            <select value={tableConfig.style} onChange={e=>setTableConfig({...tableConfig, style: e.target.value})} className="w-full bg-[#0f172a] text-white p-2 rounded border border-slate-700 mb-4">
              <option value="1" className="text-black bg-white">Light Gray Header</option><option value="2" className="text-black bg-white">Dark Header</option><option value="3" className="text-black bg-white">Blue Header</option><option value="4" className="text-black bg-white">Plain Borders</option><option value="5" className="text-black bg-white">Minimal Lines</option>
            </select>
            <div className="flex justify-end gap-2"><button onClick={()=>setShowTableModal(false)} className="px-3 py-1.5 text-slate-300">Cancel</button><button onClick={insertCustomTable} className="px-3 py-1.5 bg-blue-600 text-white rounded">Insert</button></div>
          </div>
        )}

      </div>

      {/* --- Modals --- */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowDeleteModal(false)}></div>
          <div className="bg-white/10 dark:bg-[#0f172a]/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-3xl shadow-2xl max-w-sm w-full p-8 relative z-10 text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30"><Trash2 className="w-8 h-8 text-red-400" /></div>
            <h2 className="text-2xl font-bold text-white mb-2">Delete Note?</h2>
            <p className="text-slate-300 text-sm mb-8">This action cannot be undone.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setShowDeleteModal(false)} className="px-6 py-2.5 rounded-xl font-bold bg-slate-800/80 text-white hover:bg-slate-700 border border-slate-600">Cancel</button>
              <button onClick={confirmDelete} className="px-6 py-2.5 rounded-xl font-bold bg-red-600 text-white hover:bg-red-700 border border-red-500">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {showCodeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowCodeModal(false)}></div>
          <div className="bg-[#1e293b] border border-slate-700 rounded-2xl shadow-2xl max-w-4xl w-full p-6 relative z-10 flex flex-col h-[80vh]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2"><Code className="w-5 h-5"/> Source Code</h2>
              <button onClick={() => setShowCodeModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5"/></button>
            </div>
            <div className="flex gap-2 mb-4">
              <button onClick={() => { navigator.clipboard.writeText(getCode('html')); toast.success("HTML Copied!"); }} className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"><Copy className="w-4 h-4"/> Copy HTML</button>
              <button onClick={() => { navigator.clipboard.writeText(getCode('react')); toast.success("React Code Copied!"); }} className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"><Copy className="w-4 h-4"/> Copy React JSX</button>
            </div>
            <textarea readOnly value={getCode('react')} className="flex-1 w-full bg-[#0f172a] text-green-400 font-mono p-4 rounded-xl text-sm border border-slate-700 outline-none resize-none custom-scrollbar" />
          </div>
        </div>
      )}

      {showTemplateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowTemplateModal(false)}></div>
          <div className="bg-[#1e293b] border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full p-6 relative z-10">
            <h2 className="text-xl font-bold text-white mb-2">Fill Template Data</h2>
            <p className="text-sm text-slate-400 mb-6">Enter values for placeholders.</p>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
              {templatePlaceholders.map(ph => (
                <div key={ph}>
                  <label className="block text-sm font-bold text-slate-300 mb-1 capitalize">{ph.replace(/_/g, " ")}</label>
                  <input type="text" placeholder={`Enter ${ph}...`} value={templateInputs[ph] || ""} onChange={e => setTemplateInputs({...templateInputs, [ph]: e.target.value})} className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-2.5 text-white outline-none" />
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowTemplateModal(false)} className="px-5 py-2 rounded-lg font-bold text-slate-300 hover:bg-slate-800 border border-slate-600">Cancel</button>
              <button onClick={submitTemplateValues} className="px-5 py-2 rounded-lg font-bold bg-blue-600 text-white hover:bg-blue-700">Apply to Note</button>
            </div>
          </div>
        </div>
      )}

      {showShortcuts && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowShortcuts(false)}></div>
          <div className="bg-[#1e293b] border border-slate-700 rounded-2xl shadow-2xl max-w-sm w-full p-6 relative z-10">
            <div className="flex justify-between items-center mb-5 border-b border-slate-700 pb-3">
              <h2 className="text-xl font-bold text-white flex items-center gap-2"><Keyboard className="w-5 h-5 text-blue-400"/> Shortcuts</h2>
              <button onClick={() => setShowShortcuts(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5"/></button>
            </div>
            <div className="space-y-3">
              {[['Bold','Ctrl+B'],['Italic','Ctrl+I'],['Underline','Ctrl+U'],['Align Left','Ctrl+L'],['Align Center','Ctrl+E'],['Align Right','Ctrl+R'],['Justify','Ctrl+J']].map(([label, keys]) => (
                <div key={label} className="flex justify-between text-sm text-slate-300"><span>{label}</span><span className="font-mono bg-[#0f172a] px-2 py-1 rounded border border-slate-700">{keys}</span></div>
              ))}
            </div>
            <div className="mt-5 pt-4 border-t border-slate-700 text-xs text-blue-400 font-medium text-center">💡 Auto Math: Type an equation and end with '=' (e.g. 25*4=)</div>
          </div>
        </div>
      )}

    </div>
  );
}