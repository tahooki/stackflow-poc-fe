import { layerController } from "./layerController";

type ModalInstance = {
  destroy?: () => void;
  close?: () => void;
};

export type OpenLayeredModalOptions<TModal extends ModalInstance | void> = {
  /**
   * 고유 모달 ID. 백키/모달 스택 구분용
   */
  id: string;
  /**
   * 디버그/Devtools에 표시할 라벨
   */
  label?: string;
  /**
   * 액티비티 전환 시에도 남겨둘지 여부
   */
  persistAcrossActivities?: boolean;
  /**
   * 실제 모달을 띄우는 함수(예: AntD Modal.open/confirm)
   * onClose를 호출하면 layerController도 함께 정리된다.
   */
  openModal: (handlers: { onClose: () => void }) => TModal;
  /**
   * 모달 닫힘 시 추가 정리가 필요하면 전달 (예: analytics)
   */
  onClose?: () => void;
};

/**
 * AntD Modal.open()/confirm() 같은 임퍼러티브 모달을
 * layerController 스택에 자동 등록/해제하는 브리지.
 *
 * 사용 예시:
 * const { close } = openLayeredModal({
 *   id: "confirm-delete",
 *   label: "삭제 확인",
 *   openModal: ({ onClose }) =>
 *     Modal.confirm({
 *       title: "삭제하시겠습니까?",
 *       content: <Content />,
 *       onOk: onClose,
 *       onCancel: onClose,
 *       afterClose: onClose,
 *     }),
 * });
 * close(); // 코드에서 강제 닫기 가능
 */
export const openLayeredModal = <TModal extends ModalInstance | void>({
  id,
  label,
  persistAcrossActivities,
  openModal,
  onClose,
}: OpenLayeredModalOptions<TModal>) => {
  let instance: TModal | null = null;

  const cleanup = () => {
    layerController.unregisterModalLayer(id);
    onClose?.();
    const modal = instance as ModalInstance | null;
    modal?.destroy?.();
    modal?.close?.();
  };

  layerController.registerModalLayer({
    id,
    label,
    persistAcrossActivities,
    onClose: cleanup,
  });

  instance = openModal({ onClose: cleanup });

  return {
    close: cleanup,
    instance,
  };
};
