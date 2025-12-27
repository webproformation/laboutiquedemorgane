"use client";

import { useState, useRef, useEffect } from 'react';
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
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('preview');
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (previewRef.current && activeTab === 'preview') {
      previewRef.current.innerHTML = value || '';

      previewRef.current.setAttribute('dir', 'ltr');
      previewRef.current.style.direction = 'ltr';
      previewRef.current.style.textAlign = 'left';

      const allElements = previewRef.current.querySelectorAll('*');
      allElements.forEach((el: Element) => {
        if (el instanceof HTMLElement) {
          el.setAttribute('dir', 'ltr');
          el.style.direction = 'ltr';
          el.style.textAlign = 'left';
        }
      });
    }
  }, [value, activeTab]);

  const handlePreviewInput = () => {
    if (previewRef.current) {
      // Force LTR direction on container
      previewRef.current.setAttribute('dir', 'ltr');
      previewRef.current.style.direction = 'ltr';

      // Force LTR on all child elements
      const allElements = previewRef.current.querySelectorAll('*');
      allElements.forEach((el: Element) => {
        if (el instanceof HTMLElement) {
          el.setAttribute('dir', 'ltr');
          el.style.direction = 'ltr';
        }
      });

      const newContent = previewRef.current.innerHTML;
      onChange(newContent);
    }
  };

  const handlePreviewBlur = () => {
    if (previewRef.current) {
      const newContent = previewRef.current.innerHTML;
      onChange(newContent);
    }
  };

  const renderPreview = () => {
    const isEmpty = !value || value.trim() === '';

    return (
      <div
        ref={previewRef}
        contentEditable
        suppressContentEditableWarning
        dir="ltr"
        lang="fr"
        onInput={handlePreviewInput}
        onBlur={handlePreviewBlur}
        onKeyDown={(e) => {
          if (previewRef.current) {
            previewRef.current.setAttribute('dir', 'ltr');
            previewRef.current.style.direction = 'ltr';
          }
        }}
        onPaste={(e) => {
          // Force LTR on paste
          if (previewRef.current) {
            setTimeout(() => {
              if (previewRef.current) {
                previewRef.current.setAttribute('dir', 'ltr');
                previewRef.current.style.direction = 'ltr';

                const allElements = previewRef.current.querySelectorAll('*');
                allElements.forEach((el: Element) => {
                  if (el instanceof HTMLElement) {
                    el.setAttribute('dir', 'ltr');
                    el.style.direction = 'ltr';
                  }
                });
              }
            }, 0);
          }
        }}
        className={`
          prose prose-sm max-w-none p-6 border-2 rounded-lg min-h-[150px]
          bg-gradient-to-br from-white to-gray-50
          focus:outline-none focus:ring-2 focus:ring-[#b8933d] focus:border-transparent
          hover:border-[#b8933d]/30 transition-all duration-200
          shadow-sm hover:shadow-md
          ${isEmpty ? 'empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:italic' : ''}
        `}
        data-placeholder={placeholder}
        style={{
          minHeight: `${rows * 28}px`,
          direction: 'ltr',
          textAlign: 'left',
          writingMode: 'horizontal-tb',
        }}
      />
    );
  };

  const execCommand = (command: string, value?: string) => {
    if (previewRef.current) {
      previewRef.current.focus();
      document.execCommand(command, false, value);

      previewRef.current.setAttribute('dir', 'ltr');
      const allElements = previewRef.current.querySelectorAll('*');
      allElements.forEach((el: Element) => {
        if (el instanceof HTMLElement) {
          el.setAttribute('dir', 'ltr');
          el.style.direction = 'ltr';
        }
      });

      const newContent = previewRef.current.innerHTML;
      onChange(newContent);
    }
  };

  const insertLink = () => {
    const url = prompt('Entrez l\'URL du lien:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const toolbarButtonClass = "h-9 w-9 hover:bg-[#b8933d]/10 hover:text-[#b8933d] transition-colors";

  return (
    <div className="space-y-3">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'edit' | 'preview')}>
        <div className="flex justify-between items-center">
          <TabsList className="bg-gradient-to-r from-gray-100 to-gray-50 border">
            <TabsTrigger value="preview" className="flex items-center gap-2 data-[state=active]:bg-[#b8933d] data-[state=active]:text-white">
              <Sparkles className="w-4 h-4" />
              Éditeur Visuel
            </TabsTrigger>
            <TabsTrigger value="edit" className="flex items-center gap-2 data-[state=active]:bg-[#b8933d] data-[state=active]:text-white">
              <Code className="w-4 h-4" />
              Code HTML
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="edit" className="mt-0">
          <Textarea
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className="font-mono text-sm border-2 focus:ring-[#b8933d] focus:border-[#b8933d] bg-gray-900 text-green-400"
            dir="ltr"
            style={{ direction: 'ltr', textAlign: 'left' }}
          />
          <div className="flex items-start gap-2 mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Code className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-700">
              <strong>Mode HTML :</strong> Utilisez des balises comme &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;h2&gt;, &lt;h3&gt; pour structurer votre contenu.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="mt-0 space-y-3">
          {activeTab === 'preview' && (
            <div className="border-2 border-[#b8933d]/20 rounded-lg p-3 bg-gradient-to-r from-[#b8933d]/5 to-amber-50/50 shadow-sm">
              <div className="flex flex-wrap gap-1">
                <div className="flex gap-1 items-center">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => execCommand('bold')}
                    className={toolbarButtonClass}
                    title="Gras (Ctrl+B)"
                  >
                    <Bold className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => execCommand('italic')}
                    className={toolbarButtonClass}
                    title="Italique (Ctrl+I)"
                  >
                    <Italic className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => execCommand('underline')}
                    className={toolbarButtonClass}
                    title="Souligné (Ctrl+U)"
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
                    onClick={() => execCommand('formatBlock', 'h2')}
                    className={toolbarButtonClass}
                    title="Titre H2"
                  >
                    <Heading2 className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => execCommand('formatBlock', 'h3')}
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
                    onClick={() => execCommand('insertUnorderedList')}
                    className={toolbarButtonClass}
                    title="Liste à puces"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => execCommand('insertOrderedList')}
                    className={toolbarButtonClass}
                    title="Liste numérotée"
                  >
                    <ListOrdered className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => execCommand('formatBlock', 'blockquote')}
                    className={toolbarButtonClass}
                    title="Citation"
                  >
                    <Quote className="w-4 h-4" />
                  </Button>
                </div>

                <div className="w-px h-8 bg-[#b8933d]/30 mx-1" />

                <div className="flex gap-1 items-center">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => execCommand('justifyLeft')}
                    className={toolbarButtonClass}
                    title="Aligner à gauche"
                  >
                    <AlignLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => execCommand('justifyCenter')}
                    className={toolbarButtonClass}
                    title="Centrer"
                  >
                    <AlignCenter className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => execCommand('justifyRight')}
                    className={toolbarButtonClass}
                    title="Aligner à droite"
                  >
                    <AlignRight className="w-4 h-4" />
                  </Button>
                </div>

                <div className="w-px h-8 bg-[#b8933d]/30 mx-1" />

                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={insertLink}
                  className={toolbarButtonClass}
                  title="Insérer un lien"
                >
                  <Link2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
          {renderPreview()}
          <div className="flex items-start gap-2 p-3 bg-gradient-to-r from-[#b8933d]/10 to-amber-50 border border-[#b8933d]/20 rounded-lg">
            <Sparkles className="w-4 h-4 text-[#b8933d] mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-700">
              <strong>Astuce :</strong> Cliquez dans la zone ci-dessus pour commencer à écrire. Sélectionnez du texte et utilisez les boutons de formatage pour le styliser. Le contenu s'écrit toujours de gauche à droite.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      <style jsx global>{`
        [contenteditable] {
          -webkit-user-modify: read-write-plaintext-only;
          direction: ltr !important;
          writing-mode: horizontal-tb !important;
        }

        [contenteditable] *,
        [contenteditable] p,
        [contenteditable] div,
        [contenteditable] span,
        [contenteditable] li,
        [contenteditable] ul,
        [contenteditable] ol,
        [contenteditable] h1,
        [contenteditable] h2,
        [contenteditable] h3,
        [contenteditable] h4,
        [contenteditable] h5,
        [contenteditable] h6,
        [contenteditable] blockquote,
        [contenteditable] a {
          direction: ltr !important;
          text-align: left !important;
          writing-mode: horizontal-tb !important;
        }

        [contenteditable]:focus,
        [contenteditable]:active {
          direction: ltr !important;
        }

        /* Force LTR for empty contenteditable */
        [contenteditable]:empty:before {
          direction: ltr !important;
        }
      `}</style>
    </div>
  );
}
