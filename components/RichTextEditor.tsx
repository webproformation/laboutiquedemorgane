"use client";

import { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Code } from 'lucide-react';

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
    }
  }, [value, activeTab]);

  const handlePreviewInput = () => {
    if (previewRef.current) {
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
    if (!value) {
      return (
        <div
          ref={previewRef}
          contentEditable
          dir="ltr"
          onInput={handlePreviewInput}
          onBlur={handlePreviewBlur}
          className="prose prose-sm max-w-none p-4 border rounded-md min-h-[150px] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 !text-left [&_*]:!text-left"
          data-placeholder={placeholder}
          style={{
            minHeight: `${rows * 24}px`,
            direction: 'ltr',
            textAlign: 'left',
            unicodeBidi: 'embed'
          }}
        />
      );
    }

    return (
      <div
        ref={previewRef}
        contentEditable
        dir="ltr"
        onInput={handlePreviewInput}
        onBlur={handlePreviewBlur}
        className="prose prose-sm max-w-none p-4 border rounded-md min-h-[150px] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 !text-left [&_*]:!text-left"
        style={{
          minHeight: `${rows * 24}px`,
          direction: 'ltr',
          textAlign: 'left',
          unicodeBidi: 'embed'
        }}
      />
    );
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (previewRef.current) {
      const newContent = previewRef.current.innerHTML;
      onChange(newContent);
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'edit' | 'preview')}>
      <div className="flex justify-between items-center mb-2">
        <TabsList>
          <TabsTrigger value="edit" className="flex items-center gap-2">
            <Code className="w-4 h-4" />
            Éditer
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Aperçu
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
          className="font-mono text-sm"
        />
        <p className="text-xs text-gray-500 mt-2">
          HTML supporté. Conseil : utilisez des balises simples comme &lt;p&gt;, &lt;strong&gt;, &lt;ul&gt;, &lt;li&gt;
        </p>
      </TabsContent>

      <TabsContent value="preview" className="mt-0">
        {activeTab === 'preview' && (
          <div className="flex gap-1 mb-2 p-2 bg-gray-100 rounded-md flex-wrap">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => execCommand('bold')}
              className="h-8 px-2"
              title="Gras"
            >
              <strong>B</strong>
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => execCommand('italic')}
              className="h-8 px-2"
              title="Italique"
            >
              <em>I</em>
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => execCommand('underline')}
              className="h-8 px-2"
              title="Souligné"
            >
              <u>U</u>
            </Button>
            <div className="w-px h-8 bg-gray-300 mx-1" />
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => execCommand('insertUnorderedList')}
              className="h-8 px-2"
              title="Liste à puces"
            >
              •
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => execCommand('insertOrderedList')}
              className="h-8 px-2"
              title="Liste numérotée"
            >
              1.
            </Button>
            <div className="w-px h-8 bg-gray-300 mx-1" />
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => execCommand('formatBlock', 'p')}
              className="h-8 px-2 text-xs"
              title="Paragraphe"
            >
              P
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => execCommand('formatBlock', 'h3')}
              className="h-8 px-2 text-xs"
              title="Titre"
            >
              H3
            </Button>
          </div>
        )}
        {renderPreview()}
        <p className="text-xs text-gray-500 mt-2">
          Cliquez dans le texte pour éditer directement. Utilisez les boutons ci-dessus pour formater le texte.
        </p>
      </TabsContent>
    </Tabs>
  );
}
