import React from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, ListOrdered } from 'lucide-react';

interface RichTextEditorProps {
  defaultValue?: string;
}

export function RichTextEditor({ defaultValue = '' }: RichTextEditorProps) {
  return (
    <div className="border border-gray-200 rounded-lg">
      <div className="flex items-center gap-1 p-2 border-b border-gray-200">
        <button className="p-1.5 hover:bg-gray-100 rounded">
          <Bold className="h-4 w-4" />
        </button>
        <button className="p-1.5 hover:bg-gray-100 rounded">
          <Italic className="h-4 w-4" />
        </button>
        <button className="p-1.5 hover:bg-gray-100 rounded">
          <Underline className="h-4 w-4" />
        </button>
        <span className="w-px h-5 bg-gray-200 mx-1" />
        <select className="text-sm border border-gray-200 rounded px-2 py-1">
          <option>Normal</option>
        </select>
        <span className="w-px h-5 bg-gray-200 mx-1" />
        <button className="p-1.5 hover:bg-gray-100 rounded">
          <AlignLeft className="h-4 w-4" />
        </button>
        <button className="p-1.5 hover:bg-gray-100 rounded">
          <AlignCenter className="h-4 w-4" />
        </button>
        <button className="p-1.5 hover:bg-gray-100 rounded">
          <AlignRight className="h-4 w-4" />
        </button>
        <span className="w-px h-5 bg-gray-200 mx-1" />
        <button className="p-1.5 hover:bg-gray-100 rounded">
          <List className="h-4 w-4" />
        </button>
        <button className="p-1.5 hover:bg-gray-100 rounded">
          <ListOrdered className="h-4 w-4" />
        </button>
      </div>
      <textarea
        defaultValue={defaultValue}
        className="w-full p-3 min-h-[200px] focus:outline-none"
        placeholder="Add notes..."
      />
    </div>
  );
}