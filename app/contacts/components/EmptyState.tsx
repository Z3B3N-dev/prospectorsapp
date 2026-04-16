export function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="border border-dashed rounded-lg p-10 text-center text-gray-400">
      {filtered
        ? "No hay contactos para la familia profesional seleccionada."
        : "No hay contactos para mostrar."}
    </div>
  );
}
