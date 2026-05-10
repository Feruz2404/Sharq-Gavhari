export default function DataTable({ columns, rows, empty = 'Empty' }) {
  if (!rows || rows.length === 0) {
    return <div className="glass p-10 text-center text-white/55">{empty}</div>;
  }
  return (
    // overflow-x-auto on the wrapper + min-w on the table guarantee that on
    // narrow viewports the columns keep their natural width and the wrapper
    // scrolls horizontally, instead of cramming the cells and overflowing the
    // page. min-w-0 keeps the wrapper itself shrinkable inside flex parents.
    <div className="glass overflow-x-auto min-w-0">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="text-left text-white/55 border-b border-white/10">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="px-3 py-3 font-medium whitespace-nowrap text-[11px] uppercase tracking-[0.12em]">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={r.id || idx} className="border-b border-white/5 last:border-none align-middle hover:bg-white/[0.02] transition">
              {columns.map((c) => (
                <td key={c.key} className="px-3 py-2.5">
                  {c.render ? c.render(r) : r[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
