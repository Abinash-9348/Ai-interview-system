export default function ParticipantList({ users }: any) {
  return (
    <div className="flex gap-2">
      {users.map((user: any) => (
        <div
          key={user.id}
          className="px-3 py-1 rounded-full text-xs font-bold"
          style={{
            backgroundColor: `${user.color}20`,
            color: user.color,
            border: `1px solid ${user.color}`
          }}
        >
          {user.name}
        </div>
      ))}
    </div>
  );
}