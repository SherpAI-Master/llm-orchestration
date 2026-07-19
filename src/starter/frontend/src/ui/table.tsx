import { PropsWithChildren } from "react";
export function Table({ children }: PropsWithChildren){ return <div className="overflow-x-auto border rounded-xl bg-white">{children}</div>; }
export function THead({ children }: PropsWithChildren){ return <thead className="bg-gray-50 text-left text-sm text-gray-600">{children}</thead>; }
export function TR({ children }: PropsWithChildren){ return <tr className="border-b last:border-0">{children}</tr>; }
export function TH({ children }: PropsWithChildren){ return <th className="px-4 py-2 font-medium">{children}</th>; }
export function TD({ children }: PropsWithChildren){ return <td className="px-4 py-2 text-sm">{children}</td>; }
