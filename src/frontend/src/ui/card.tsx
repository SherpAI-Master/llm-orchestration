import { PropsWithChildren } from "react";
export function Card({ children }: PropsWithChildren){ return <div className="rounded-xl border bg-white p-4 shadow-sm">{children}</div>; }
export function CardTitle({ children }: PropsWithChildren){ return <h3 className="text-sm font-semibold text-gray-700">{children}</h3>; }
export function CardValue({ children }: PropsWithChildren){ return <div className="mt-1 text-2xl font-bold">{children}</div>; }
