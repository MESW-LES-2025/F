export function GetStartedSectionCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-xl border bg-background p-6 transition-all hover:shadow-md hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}