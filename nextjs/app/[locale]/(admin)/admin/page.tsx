"use client";

import dynamic from "next/dynamic";

const Admin = dynamic(
    () => import("@/components/admin").then((mod) => mod.Admin),
    { ssr: false }
);

export default function AdminPage() {
    return (
        <Admin />
    );
}