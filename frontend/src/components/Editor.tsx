// 
import { useState, useEffect } from "react";
import MonacoEditor from "@monaco-editor/react";

type Props = {
  value: string;
  onChange: (val: string) => void;
  onCursorMove: (pos: any) => void;
  theme: string;
  editorRef?: React.MutableRefObject<any>;
};

export default function Editor({
  value,
  onChange,
  onCursorMove,
  theme,
  editorRef,
}: Props) {
  const [code, setCode] = useState(value || "");

  // sync external code
  useEffect(() => {
    if (value !== undefined) {
      setCode(value);
    }
  }, [value]);

  // code change
  const handleChange = (newValue: string | undefined) => {
    const val = newValue || "";
    setCode(val);
    onChange(val);
  };

  // mount editor
  const handleMount = (editor: any) => {
    if (editorRef) {
      editorRef.current = editor;
    }

    let timeout: any;

    editor.onDidChangeCursorPosition((e: any) => {
      clearTimeout(timeout);

      timeout = setTimeout(() => {
        const pos = e.position;
        const coords = editor.getScrolledVisiblePosition(pos);
        if (!coords) return;

        onCursorMove({
          top: coords.top,
          left: coords.left,
          height: coords.height,
        });
      }, 30);
    });
  };

  return (
    <div style={{ height: "100%", width: "100%", position: "relative" }}>
      <MonacoEditor
        height="90%"
        language="javascript"
        theme={theme}
        value={code}
        onChange={handleChange}
        onMount={handleMount}
        options={{
          automaticLayout: true,
          minimap: { enabled: false },
          fontSize: 14,
          scrollBeyondLastLine: false,
        }}
      />
    </div>
  );
}