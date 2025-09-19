import { AppScreen } from "@stackflow/plugin-basic-ui";
import type { ActivityComponentType } from "@stackflow/react";

import { useNavActions } from "../hooks/useNavActions";

type ModalActivityParams = {
  source?: string;
  message?: string;
};

const ModalActivity: ActivityComponentType<ModalActivityParams> = ({
  params,
}: {
  params: ModalActivityParams;
}) => {
  const { pop } = useNavActions();

  return (
    <AppScreen backgroundColor="rgba(15, 23, 42, 0.72)">
      <div className="modal-overlay">
        <div className="modal-card">
          <h2>Stackflow Modal</h2>
          <p>
            {params.message ?? "Use this overlay to confirm modal push/pop semantics."}
          </p>
          {params.source && (
            <p className="modal-meta">Triggered from: {params.source}</p>
          )}

          <button type="button" onClick={() => pop()} className="modal-close">
            Close overlay
          </button>
        </div>
      </div>
    </AppScreen>
  );
};

export default ModalActivity;
