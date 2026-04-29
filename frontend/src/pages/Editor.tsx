export default function Editor({ value, onChange, onCursorMove }: any) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}

      onKeyUp={(e) => {
        console.log("KEYUP"); // 🔥 debug
        onCursorMove?.(e);
      }}

      onClick={(e) => {
        console.log("CLICK"); // 🔥 debug
        onCursorMove?.(e);
      }}

      onSelect={(e) => {
        console.log("SELECT"); // 🔥 debug
        onCursorMove?.(e);
      }}

      className="w-full h-full bg-transparent text-white p-4 outline-none"
    />
  );
}