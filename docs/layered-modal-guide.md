# Layered modal guide (for imperative modals)

이 문서는 `layerController`를 사용해서 임퍼러티브 모달(예: Ant Design `Modal.open/confirm`)을 스택/백키 흐름에 연결하는 방법을 설명합니다. 기존 모달 라이브러리를 그대로 쓰면서, Back 키나 Stackflow 레이어 데브툴에서 모달을 추적할 수 있습니다.

## TL;DR: 헬퍼 한 번 감싸기

`src/lib/layeredModalBridge.ts`에 있는 `openLayeredModal`을 사용하면 됩니다.

```ts
import { Modal } from "antd";
import { openLayeredModal } from "../lib/layeredModalBridge";

const openDeleteConfirm = () => {
  const { close } = openLayeredModal({
    id: "confirm-delete", // 화면마다 고유하게
    label: "삭제 확인",    // 데브툴/디버그용
    openModal: ({ onClose }) =>
      Modal.confirm({
        title: "삭제하시겠습니까?",
        content: "이 작업은 되돌릴 수 없습니다.",
        onOk: onClose,
        onCancel: onClose,
        afterClose: onClose,
      }),
  });

  // 필요하면 코드에서 강제로 닫기
  // close();
};
```

## 왜 필요한가?

- Stackflow 백키 처리(`handleBackPress`)는 등록된 모달을 먼저 닫고, 없으면 스텝/액티비티를 pop 합니다.
- `layerController.registerModalLayer()`로 모달을 등록하면 백키가 AntD 모달까지 닫아주고, `LayerStackDevtools`에서도 모달이 보입니다.
- `openLayeredModal`는 등록/해제/`destroy()` 호출을 묶어서 반복 코드를 줄여줍니다.

## 직접 붙이고 싶다면 (헬퍼 없이)

```ts
import { Modal } from "antd";
import { layerController } from "../lib/layerController";

const openModal = () => {
  const modalId = "my-modal";

  let instance: { destroy?: () => void } | undefined;
  const cleanup = () => {
    layerController.unregisterModalLayer(modalId);
    instance?.destroy?.();
  };

  layerController.registerModalLayer({
    id: modalId,
    label: "My Modal",
    onClose: cleanup,
  });

  instance = Modal.open({
    content: <Content />,
    onOk: cleanup,
    onCancel: cleanup,
    afterClose: cleanup,
  });
};
```

## 옵션

- `id`: 필수. 한 화면에서 겹치지 않는 고유 ID.
- `label`: 데브툴/디버깅용 텍스트.
- `persistAcrossActivities`: `true`면 액티비티가 pop 되더라도 모달을 유지합니다(기본값 false).
- `onClose`: 모달 닫힐 때 추가로 실행할 콜백(로그 등).

## 주의사항

- `onOk/onCancel/afterClose` 등 모든 종료 경로에서 `onClose`를 호출하세요. `openLayeredModal`은 이를 자동으로 묶어줍니다.
- 여러 모달을 동시에 띄울 때는 `id`를 중복하지 않도록 관리하세요.
- React 상태 없이 임퍼러티브 모달을 써도, `LayerStackDevtools`에는 모달이 표시됩니다.
