interface RecruiterPerceptionProps {
  roles: string[];
}

const RecruiterPerception = ({ roles }: RecruiterPerceptionProps) => {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          <span className="text-xl">👁️</span>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-card-foreground">Primeiros 5 segundos de leitura</h3>
          <p className="text-xs text-muted-foreground">O que um recrutador retém do teu CV</p>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {roles.map((role, i) => (
          <span
            key={i}
            className="px-3 py-1 rounded-full text-xs font-medium bg-[#C9A961]/10 text-[#C9A961] border border-[#C9A961]/20"
          >
            {role}
          </span>
        ))}
      </div>
    </div>
  );
};

export default RecruiterPerception;
