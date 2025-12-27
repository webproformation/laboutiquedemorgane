"use client";

import { useState, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Eye,
  Code,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link2,
  Quote,
  Sparkles
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  id?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Entrez le contenu...',
  rows = 6,
  id
}: RichTextEditorProps) {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertTag = (tag: string, hasClosingTag = true) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    let newText = '';
    if (hasClosingTag) {
      newText = value.substring(0, start) + `<${tag}>${selectedText}</${tag}>` + value.substring(end);
    } else {
      newText = value.substring(0, start) + `<${tag}>` + value.substring(end);
    }

    onChange(newText);

    setTimeout(() => {
      if (hasClosingTag) {
        textarea.focus();
        textarea.setSelectionRange(start + tag.length + 2, start + tag.length + 2 + selectedText.length);
      } else {
        textarea.focus();
        textarea.setSelectionRange(start + tag.length + 2, start + tag.length + 2);
      }
    }, 0);
  };

  const wrapSelection = (openTag: string, closeTag: string) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    const newText = value.substring(0, start) + openTag + selectedText + closeTag + value.substring(end);
    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + openTag.length, start + openTag.length + selectedText.length);
    }, 0);
  };

  const handleBold = () => wrapSelection('<strong>', '</strong>');
  const handleItalic = () => wrapSelection('<em>', '</em>');
  const handleUnderline = () => wrapSelection('<u>', '</u>');
  const handleH2 = () => insertTag('h2');
  const handleH3 = () => insertTag('h3');
  const handleParagraph = () => insertTag('p');
  const handleUnorderedList = () => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const newText = value.substring(0, start) + '<ul>\n  <li>Item 1</li>\n  <li>Item 2</li>\n</ul>\n' + value.substring(start);
    onChange(newText);
  };
  const handleOrderedList = () => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const newText = value.substring(0, start) + '<ol>\n  <li>Item 1</li>\n  <li>Item 2</li>\n</ol>\n' + value.substring(start);
    onChange(newText);
  };

  const handleLink = () => {
    const url = prompt('Entrez l\'URL du lien:');
    if (url) {
      wrapSelection(`<a href="${url}">`, '</a>');
    }
  };

  const toolbarButtonClass = "h-9 w-9 hover:bg-[#b8933d]/10 hover:text-[#b8933d] transition-colors";

  return (
    <div className="space-y-3">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'edit' | 'preview')}>
        <div className="flex justify-between items-center">
          <TabsList className="bg-gradient-to-r from-gray-100 to-gray-50 border">
            <TabsTrigger value="edit" className="flex items-center gap-2 data-[state=active]:bg-[#b8933d] data-[state=active]:text-white">
              <Code className="w-4 h-4" />
              Éditeur
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2 data-[state=active]:bg-[#b8933d] data-[state=active]:text-white">
              <Eye className="w-4 h-4" />
              Aperçu
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="edit" className="mt-0 space-y-3">
          <div className="border-2 border-[#b8933d]/20 rounded-lg p-3 bg-gradient-to-r from-[#b8933d]/5 to-amber-50/50 shadow-sm">
            <div className="flex flex-wrap gap-1">
              <div className="flex gap-1 items-center">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={handleBold}
                  className={toolbarButtonClass}
                  title="Gras"
                >
                  <Bold className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={handleItalic}
                  className={toolbarButtonClass}
                  title="Italique"
                >
                  <Italic className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={handleUnderline}
                  className={toolbarButtonClass}
                  title="Souligné"
                >
                  <Underline className="w-4 h-4" />
                </Button>
              </div>

              <div className="w-px h-8 bg-[#b8933d]/30 mx-1" />

              <div className="flex gap-1 items-center">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={handleH2}
                  className={toolbarButtonClass}
                  title="Titre H2"
                >
                  <Heading2 className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={handleH3}
                  className={toolbarButtonClass}
                  title="Titre H3"
                >
                  <Heading3 className="w-4 h-4" />
                </Button>
              </div>

              <div className="w-px h-8 bg-[#b8933d]/30 mx-1" />

              <div className="flex gap-1 items-center">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={handleUnorderedList}
                  className={toolbarButtonClass}
                  title="Liste à puces"
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={handleOrderedList}
                  className={toolbarButtonClass}
                  title="Liste numérotée"
                >
                  <ListOrdered className="w-4 h-4" />
                </Button>
              </div>

              <div className="w-px h-8 bg-[#b8933d]/30 mx-1" />

              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleLink}
                className={toolbarButtonClass}
                title="Insérer un lien"
              >
                <Link2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <Textarea
            ref={textareaRef}
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className="font-mono text-sm border-2 focus:ring-[#b8933d] focus:border-[#b8933d]"
            dir="ltr"
            style={{ direction: 'ltr', textAlign: 'left' }}
          />
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Sparkles className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-700">
              <strong>Astuce :</strong> Sélectionnez du texte et cliquez sur les boutons de formatage pour ajouter des balises HTML. Vous pouvez aussi écrire directement en HTML.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="mt-0">
          <div
            className="prose prose-sm max-w-none p-6 border-2 rounded-lg min-h-[150px] bg-white"
            style={{ direction: 'ltr', textAlign: 'left' }}
            dangerouslySetInnerHTML={{ __html: value || '<p class="text-gray-400 italic">Aucun contenu à prévisualiser</p>' }}
          />
          <div className="flex items-start gap-2 mt-3 p-3 bg-gradient-to-r from-[#b8933d]/10 to-amber-50 border border-[#b8933d]/20 rounded-lg">
            <Eye className="w-4 h-4 text-[#b8933d] mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-700">
              <strong>Aperçu :</strong> Ceci est le rendu de votre contenu HTML tel qu'il apparaîtra sur le site.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
