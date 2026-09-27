import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Heading2, Italic, List, ListOrdered, Quote, Redo, Underline as U, Undo } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

function Tool({ on, active, label, children }: { on: () => void; active?: boolean; label: string; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={on}
      className={cn("rounded p-1.5 hover:bg-muted [&_svg]:size-4", active && "bg-accent text-accent-foreground")}>
      {children}
    </button>
  );
}

function Toolbar({ e }: { e: Editor }) {
  return (
    <div className="flex flex-wrap gap-0.5 border-b bg-muted/50 p-1">
      <Tool label="Bold" on={() => e.chain().focus().toggleBold().run()} active={e.isActive("bold")}><Bold /></Tool>
      <Tool label="Italic" on={() => e.chain().focus().toggleItalic().run()} active={e.isActive("italic")}><Italic /></Tool>
      <Tool label="Underline" on={() => e.chain().focus().toggleUnderline().run()} active={e.isActive("underline")}><U /></Tool>
      <Tool label="Heading" on={() => e.chain().focus().toggleHeading({ level: 2 }).run()} active={e.isActive("heading")}><Heading2 /></Tool>
      <Tool label="Bullet list" on={() => e.chain().focus().toggleBulletList().run()} active={e.isActive("bulletList")}><List /></Tool>
      <Tool label="Numbered list" on={() => e.chain().focus().toggleOrderedList().run()} active={e.isActive("orderedList")}><ListOrdered /></Tool>
      <Tool label="Quote" on={() => e.chain().focus().toggleBlockquote().run()} active={e.isActive("blockquote")}><Quote /></Tool>
      <span className="mx-1 w-px bg-border" />
      <Tool label="Undo" on={() => e.chain().focus().undo().run()}><Undo /></Tool>
      <Tool label="Redo" on={() => e.chain().focus().redo().run()}><Redo /></Tool>
    </div>
  );
}

export function RichTextEditor({ value, onChange, placeholder, id }: { value: string; onChange: (html: string) => void; placeholder?: string; id?: string }) {
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] }, codeBlock: false, code: false }), Underline],
    content: value,
    editorProps: { attributes: { class: "prose-clinical px-3 py-2 text-sm", "aria-label": placeholder ?? "Rich text", id: id ?? "" , "data-placeholder": placeholder ?? "" } },
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? "" : editor.getHTML()),
  });
  useEffect(() => {
    if (editor && value !== editor.getHTML() && !(value === "" && editor.isEmpty)) editor.commands.setContent(value, false);
  }, [value, editor]);
  return (
    <div className="overflow-hidden rounded-lg border bg-card focus-within:ring-2 focus-within:ring-ring">
      {editor && <Toolbar e={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}
