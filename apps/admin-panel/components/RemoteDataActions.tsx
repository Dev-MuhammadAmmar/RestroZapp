"use client";

import { InlineActionForm } from "./ActionForm";
import { requestDataCommandAction } from "@/app/admin/actions";

type Props = {
  restaurantId: string;
  restaurantName: string;
};

export function RemoteDataActions({ restaurantId, restaurantName }: Props) {
  const action = requestDataCommandAction.bind(null, restaurantId);

  return (
    <div className="button-row">
      <InlineActionForm
        action={action}
        fields={{ action: "push_backup" }}
        label="Request Push Backup"
        pendingLabel="Requesting..."
      />
      <InlineActionForm
        action={action}
        fields={{ action: "restore_latest" }}
        label="Request Restore Latest"
        pendingLabel="Requesting..."
        danger
        confirmMessage={`Restore ${restaurantName} from its latest verified cloud snapshot? The POS will create an emergency local backup first and restart after recovery.`}
      />
    </div>
  );
}
