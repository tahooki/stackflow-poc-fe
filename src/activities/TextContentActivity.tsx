import { AppScreen } from "@stackflow/plugin-basic-ui";
import type { ActivityComponentType } from "@stackflow/react";

export type TextContentActivityParams = Record<string, never>;

const TextContentActivity: ActivityComponentType<TextContentActivityParams> = () => {
  return (
    <AppScreen appBar={{ title: "Article" }}>
      <div className="activity">
        <section className="activity__header">
          <h1>일반 콘텐츠 페이지</h1>
          <p>
            무거운 메모리 스택 위에 올려서 전환 애니메이션과 스크롤 유지 동작을 검증하기 위한 간단한 텍스트 화면입니다.
          </p>
        </section>

        <div className="activity__content">
          <section className="activity__card">
            <h2>개요</h2>
            <p>
              이 페이지는 가벼운 UI 구성 요소만 포함하여 렌더링 자체에 큰 부담이 없습니다. 대신 전형적인 기사 레이아웃과
              유사한 구조를 담고 있어 실제 사용자 흐름과 가까운 조건을 재현합니다.
            </p>
          </section>

          <section className="activity__card">
            <h2>본문</h2>
            <p>
              스택에 다수의 메모리 집중 활동이 존재하는 상태에서 이 화면으로 전환해 애니메이션이 얼마나 부드러운지 확인해
              보세요.
            </p>
            <p>
              동시에 스크롤을 여러 위치로 이동한 뒤 뒤로 가기와 앞으로 가기를 반복하면 Stackflow가 기본적으로 제공하는
              스크롤 복구 기능이 유지되는지도 쉽게 관찰할 수 있습니다.
            </p>
            <p>
              실제 서비스 상황처럼 다양한 길이의 문단을 배치하고 텍스트 스타일만 적용했기 때문에 DOM 노드 수가 최소화되어
              있으며, 레이아웃 계산 역시 간단하게 끝납니다.
            </p>
          </section>

          <section className="activity__card">
            <h2>체크 포인트</h2>
            <ul>
              <li>전환 애니메이션이 heavy 스택 위에서도 일정한지</li>
              <li>뒤로가기/앞으로가기 시 스크롤 위치가 정확히 복구되는지</li>
              <li>메모리 모니터링 툴에서 누수가 발생하지 않는지</li>
            </ul>
          </section>

          <section className="activity__card">
            <h2>추가 메모</h2>
            <p>
              필요하다면 이 화면을 복제하여 다양한 길이나 구성의 텍스트 페이지를 비교 실험에 사용할 수 있습니다. 예를 들어
              헤더 이미지를 추가하거나, 리스트 길이를 늘려서 레이아웃 확장을 재현할 수 있습니다.
            </p>
          </section>
        </div>
      </div>
    </AppScreen>
  );
};

export default TextContentActivity;
