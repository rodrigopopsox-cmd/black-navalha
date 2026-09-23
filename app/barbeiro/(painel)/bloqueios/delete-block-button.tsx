"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";

import { deleteBarberBlock } from "./actions";

export default function BarberDeleteBlockButton({
  blockId,
}: {
  blockId: string;
}) {
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    const confirmed = window.confirm(
      "Deseja realmente excluir este bloqueio?"
    );

    if (!confirmed) {
      return;
    }

    setMessage("");

    startTransition(async () => {
      const result = await deleteBarberBlock(blockId);

      if (!result.success) {
        setMessage(result.message);
      }
    });
  }

  return (
    <div>
      <button
        type="button"
        className="barber-delete-block"
        onClick={handleDelete}
        disabled={pending}
      >
        <Trash2 size={14} />
        {pending ? "EXCLUINDO..." : "EXCLUIR"}
      </button>

      {message && (
        <span className="barber-delete-error">
          {message}
        </span>
      )}
    </div>
  );
}