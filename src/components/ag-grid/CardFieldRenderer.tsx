import { forwardRef, useImperativeHandle } from "react";
import type { ForwardedRef, Ref } from "react";
import type { ICellRendererParams } from "ag-grid-community";

import type { CardField } from "../../lib/agGridCardFields";

type RendererParams<TData> = ICellRendererParams<TData, CardField<TData>[]>;

const CardFieldRendererInner = <TData,>(
  { value }: RendererParams<TData>,
  ref: ForwardedRef<unknown>,
) => {
  useImperativeHandle(ref, () => ({
    refresh: () => false,
  }));

  if (!value || value.length === 0) {
    return null;
  }

  return (
    <article className="order-card">
      <dl className="order-card__list">
        {value.map((field) => (
          <div key={field.key} className="order-card__list-row">
            <dt>{field.label}</dt>
            <dd>{field.content}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
};

const CardFieldRenderer = forwardRef(CardFieldRendererInner) as <TData>(
  props: RendererParams<TData> & { ref?: Ref<unknown> },
) => JSX.Element | null;

export default CardFieldRenderer;
