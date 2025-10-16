import { useCallback, useEffect, useMemo, useState } from "react";
import { AppScreen } from "@stackflow/plugin-basic-ui";
import type { ActivityComponentType } from "@stackflow/react";
import { useNavActions } from "../hooks/useNavActions";
import { usePushQueue } from "../hooks/usePushQueue";
import { useStackCount } from "../hooks/useStackCount";
import { performanceTracker } from "../lib/performanceTracker";
import { memoryUtils } from "../lib/memoryUtils";
import { useStack } from "@stackflow/react";

export type TextContentActivityParams = Record<string, never>;

const TEXT_DISPATCH_COUNT_KEY = "text-activity-dispatched-count";
const TARGET_ARTICLE_BYTES = 512 * 1024;

type ArticleSection = {
  id: string;
  title: string;
  paragraphs: string[];
};

type GeneratedArticle = {
  sections: ArticleSection[];
  byteSize: number;
};

const BASE_ARTICLE_SECTIONS: ReadonlyArray<{
  heading: string;
  paragraphs: ReadonlyArray<string>;
}> = [
  {
    heading: "Stackflow 도입 배경",
    paragraphs: [
      "Stackflow는 웹 환경에서 모바일 스택 네비게이션을 재현하기 위해 만들어진 라이브러리로, 전환 애니메이션과 스크롤 복원에 초점을 맞춘다. 조직 내부에서는 기존 페이지 전환 흐름의 유지보수 비용을 줄이고 실험적인 화면 배치를 빠르게 검증하기 위한 도구로 채택했다. 초기 도입 시점에는 React Navigation과의 차이를 정리한 비교 보고서를 작성하여 이해관계자 설득에 활용했다.",
      "프론트엔드 챕터는 Stackflow의 코어가 프레임워크에 의존하지 않고 독립적으로 동작한다는 점에 주목했다. 여러 제품을 동시에 운영하는 팀 입장에서는 네이티브 앱과 웹뷰 모두에서 동일한 흐름을 재사용할 수 있다는 사실이 중요한 구매 포인트였다. 이 때문에 아키텍처 리뷰 미팅에서 모바일과 웹 담당자가 함께 참여하여 요구 조건을 명확히 합의했다.",
      "Stackflow를 정식으로 도입하기 전에는 최소 기능 시범 서비스(MVP)를 두 차례 제작했다. 첫 번째 버전에서는 단순한 글 목록과 상세 페이지 정도만 검증했고, 두 번째 버전에서는 복잡한 입력 폼과 릴레이션 데이터 조회까지 포함했다. 이러한 파일럿 진행 과정에서 스택 깊이가 커질 때 발생하는 메모리 사용량을 계측하여 향후 개선 계획의 기준선을 세웠다.",
    ],
  },
  {
    heading: "전환 애니메이션 평가",
    paragraphs: [
      "전환 애니메이션을 평가하기 위해 FPS 로그와 사용자 피드백을 동시에 수집했다. QA 스크립트는 전환 시작과 종료 이벤트에 타임스탬프를 찍고, 각 테스트 기기에서 60Hz 기준으로 프레임 손실 비율을 계산했다. 결과적으로 저사양 기기에서도 평균 프레임 손실률이 7퍼센트를 넘지 않았으며, 이는 현재 사용 중인 CSS 기반 애니메이션보다 안정적이라는 판단을 내리는 근거가 되었다.",
      "실제 사용자 베타 테스트에서는 애니메이션 속도에 대한 선호도가 상이하게 나타났다. 세그먼트 분석 결과 숙련된 사용자일수록 빠른 속도를 선호했고, 새로운 사용자일수록 단계별 안내가 잘 보이는 느린 속도를 선호했다. 이를 해결하기 위해 Stackflow의 트랜지션 설정을 퍼널 단계별로 나누어, 온보딩 구간에서는 완만한 모션을 제공하고 고빈도 작업 구간에서는 즉시형 모션을 제공하도록 분기했다.",
      "팀은 애니메이션을 단순히 시각 효과로 보지 않고 작업 컨텍스트 전환을 돕는 장치로 해석했다. 따라서 디자이너는 각 화면 전환에 의미를 부여하는 내러티브를 설계했고, 개발자는 Stackflow가 제공하는 라이프사이클 훅에 맞춰 상태 전이를 세밀하게 제어했다. 이 과정에서 발견한 병목은 주로 이미지 프리로딩과 관련되어 있었으며, lazy-load 전략을 보완해 해결했다.",
    ],
  },
  {
    heading: "스크롤 유지 전략",
    paragraphs: [
      "Scroll Retention 전략은 Stackflow를 도입한 가장 큰 이유 중 하나였다. 기존 SPA 라우터는 페이지를 복귀할 때 스크롤 위치를 완벽하게 복원하지 못해 사용자가 다시 맨 위로 이동해야 하는 불편을 겪었다. Stackflow는 스택에 저장된 각 Activity의 스크롤 상태를 기록하고 복원하여, 여러 번 왕복 이동이 필요한 콘텐츠 브라우징 경험에서도 안정적으로 동작했다.",
      "스크롤 복원 기능을 검증하기 위해 팀은 다양한 길이의 문서를 준비하고, 각 문단 중앙과 하단에서 뒤로 가기를 반복했다. 테스트 자동화 스크립트는 IntersectionObserver를 활용하여 복귀 후 가시 영역에 위치한 요소를 비교했다. 그 결과 99퍼센트 이상의 케이스에서 정확한 위치가 복원되었으며, 나머지 케이스는 실험적으로 강제 레이아웃 변경을 일으킨 상황이었다.",
      "연구 과정에서는 가상 키보드가 열렸다 닫히는 환경과 동적 컨텐츠 삽입 상황도 포함했다. 특히 모바일 브라우저에서는 주소창이 축소되거나 확대될 때 뷰포트 높이가 달라지는 문제가 있는데, Stackflow는 이를 감지하여 스크롤 계산에 반영했다. 덕분에 고객 상담 팀에서 보고하던 입력 후 스크롤이 튄다는 이슈가 현저히 감소했다.",
    ],
  },
  {
    heading: "네비게이션 상태 동기화",
    paragraphs: [
      "네비게이션 상태를 URL과 동기화하는 문제는 복수의 실험을 동시에 운영하는 환경에서 매우 중요하다. Stackflow의 History Sync 플러그인은 스택과 브라우저 히스토리 사이에 일관성을 유지하도록 설계되어 있어, 실험 플래그가 달라져도 동일한 세션 재현이 가능했다. 덕분에 QA 팀은 버그 리포트를 작성할 때 URL만 공유해도 정확한 화면 스택을 재현할 수 있었다.",
      "이 시스템을 도입하면서 기존에 사용하던 커스텀 라우터 로직은 점차 단순화되었다. 이전에는 조건문이 복잡하게 얽혀 있어 특정 실험군에서만 발생하는 이슈를 추적하기 어려웠다. Stackflow에서 제공하는 state-plugin 인터페이스를 사용하면, 각 Activity의 파라미터를 명확하게 타입 정의하고 필요한 경우 히스토리와 동기화할 수 있어 유지보수가 쉬워졌다.",
      "또한 서버 렌더링과의 호환성을 검토하기 위해 Next.js 환경에서 별도 샘플을 제작했다. 초기 렌더링에서 스택 상태가 올바르게 주입되는지, 클라이언트 하이드레이션 과정에서 불일치가 발생하지 않는지 집중적으로 살폈다. 결과적으로 몇 가지 hydration 경고를 수정한 후에는 서버 렌더링과 클라이언트 네비게이션 사이의 상태 불일치 문제가 사라졌다.",
    ],
  },
  {
    heading: "데이터 프리페칭 경험",
    paragraphs: [
      "대용량 문서를 탐색하는 도중 다음 화면을 미리 가져오는 프리페칭 전략은 사용자 체감 속도를 크게 개선했다. Stackflow는 전환 직전 prefetch 이벤트를 활용할 수 있으므로, 전환 대상 Activity에서 필요한 API를 사전에 호출하는 패턴을 도입했다. 이 방식을 적용한 이후 평균 전환 시간이 280밀리초에서 140밀리초로 줄어들었다.",
      "그러나 모든 화면에서 프리페칭을 적용하면 네트워크 사용량이 급증했다. 따라서 데이터 팀과 협력해 전환 확률이 높은 경로만 선별하고, 에지 케이스에서는 기존 지연 로딩 로직을 유지했다. 또한 Prefetch 결과를 캐시에 저장할 때 만료 시간을 짧게 설정하여, 오래된 데이터를 불러오는 문제를 방지했다.",
      "프리페칭 결과는 퍼포먼스 대시보드에 기록되어 실시간으로 모니터링되었다. 대시보드는 Stackflow의 라이프사이클 훅에서 수집한 이벤트와 웹 바이탈 지표를 함께 보여준다. 이를 통해 특정 기기나 네트워크 환경에서 일시적으로 응답 속도가 느려졌을 때 빠르게 대응할 수 있었다.",
    ],
  },
  {
    heading: "플러그인 생태계 활용",
    paragraphs: [
      "Stackflow의 플러그인 시스템은 팀이 실험을 빠르게 추가하고 제거할 수 있도록 돕는다. 기본 제공되는 플러그인 외에도 프로젝트 요구 사항에 맞게 커스텀 플러그인을 제작하여 배포했다. 예컨대 탐색 과정에서 마케팅 트래킹을 삽입하거나, 특정 Activity에서만 접근 가능한 보조 메뉴를 노출하는 기능이 이에 해당한다.",
      "플러그인을 설계할 때 가장 중요한 기준은 순수성과 의존성 분리였다. 공용 패키지에 포함된 플러그인은 외부 상태에 의존하지 않도록 작성했고, 필요한 경우 DI 컨테이너를 통해 의존성을 주입했다. 이러한 구조 덕분에 베타 기능을 켜거나 끌 때도 나머지 플러그인이 서로 영향을 주지 않았다.",
      "문서화를 위해 플러그인별 라이프사이클 다이어그램을 Notion과 코드 베이스에 함께 정리했다. 신규 팀원이 합류하면 다이어그램을 확인하고 특정 이벤트가 언제 실행되는지 빠르게 이해할 수 있었다. 또한 플러그인 버전과 Stackflow 버전의 호환성을 표 형태로 관리하여 업데이트 시점에 혼란이 없도록 배려했다.",
    ],
  },
  {
    heading: "성능 진단 프로토콜",
    paragraphs: [
      "성능 진단을 표준화하기 위해 팀은 Stackflow 상용 서비스에 APM 태그를 추가했다. 각 Activity가 마운트될 때와 스택에서 제거될 때의 시간을 측정하여, 반복되는 방문 간 평균 비용을 계산했다. 이 데이터는 Grafana 대시보드에서 시계열로 표시되어 이슈 발생 시 원인을 빠르게 추적하는 데 활용됐다.",
      "렌더링 지연이 감지되면 Lighthouse 스크립트를 통해 자동으로 진단 리포트를 생성했다. 리포트는 주요 메트릭과 함께 DOM 노드 수, 메모리 스냅샷, 이벤트 루프 지연 시간을 포함했다. Stackflow 기반 화면은 DOM 구조가 비교적 단순하기 때문에, 지연이 발생하면 대부분 외부 라이브러리나 이미지 최적화 문제로 좁혀졌다.",
      "또한 팀은 React Profiler를 사용하여 Activity 간 리렌더링 횟수를 세밀하게 분석했다. Stackflow의 상태 업데이트가 불필요하게 트리거되는 구간을 찾아 메모이제이션을 적용하거나, Context 분리 전략을 도입했다. 이러한 최적화 결과 가장 복잡한 화면에서도 평균 커밋 시간이 18밀리초 이하로 유지되었다.",
    ],
  },
  {
    heading: "팀 협업 경험",
    paragraphs: [
      "Stackflow를 중심으로 한 작업 흐름은 디자이너, 개발자, PM이 동일한 용어로 커뮤니케이션하는 데 도움이 되었다. 화면 정의서를 작성할 때 Activity 개념을 기준으로 서술하니, 각자의 책임 범위가 명확해졌다. 이는 요구사항 변경이 빈번한 프로젝트에서 일정 관리를 크게 단순화했다.",
      "디자인 시스템팀은 Activity별 레이아웃 가이드를 문서화해 공유했다. 작업자는 해당 가이드를 참고하여 공통 패딩, 헤더 동작, 스켈레톤 상태 등을 일관되게 구현할 수 있었다. Stackflow의 AppScreen 컴포넌트를 커스터마이징해 프로젝트 전반에서 재사용 가능한 UI 패턴을 확보했다.",
      "프로젝트 관리 측면에서는 Stackflow의 스택 구조가 태스크 분할 기준이 되었다. 각 Activity의 완성도를 체크리스트 형태로 관리하고, QA 시나리오도 Activity 단위로 작성했다. 이러한 방식은 기능 플래그를 사용할 때 특정 Activity만 노출하는 실험을 설계하기 쉽게 만들었다.",
    ],
  },
  {
    heading: "사용자 테스트 피드백",
    paragraphs: [
      "사용자 테스트 세션에서는 스크롤 회복과 전환 감각에 대한 정성적 피드백을 수집했다. 참가자들은 콘텐츠가 많은 화면에서 뒤로 가기를 반복하는 시나리오를 수행했으며, 이전보다 흐름이 자연스럽다는 의견이 많았다. 특히 긴 기사형 콘텐츠를 읽을 때 처음 위치로 튕기는 문제가 해결된 점을 높이 평가했다.",
      "또한 설문을 통해 Stackflow 기반 네비게이션이 업무 효율에 어떤 영향을 주었는지 조사했다. 고객 상담원들은 상담 기록과 관련 매뉴얼을 오가면서 스크롤 위치가 유지되는 덕분에 반복 업무 피로도가 낮아졌다고 답했다. 반면 일부 사용자는 전환 애니메이션 속도가 빨라 의도치 않게 화면을 건너뛰었다고 응답하여, 이후 세션에서 속도를 조절했다.",
      "피드백을 분석할 때는 세션 녹화와 이벤트 로그를 함께 검토했다. Interaction to Next Paint(INP)가 길어지는 구간을 pinpoint하여 해당 활동의 컴포넌트를 리팩토링했다. 이를 통해 사용자 체감 속도 개선과 동시에 장기적인 유지보수 지표도 함께 향상됐다.",
    ],
  },
  {
    heading: "향후 로드맵 메모",
    paragraphs: [
      "향후 로드맵에서는 Stackflow 2.0 프리뷰를 활용하여 초기 로딩 속도를 단축할 계획이다. Loader API를 도입하면 React 의존도가 줄어들고, 서버에서 준비한 데이터를 더욱 빠르게 주입할 수 있을 것으로 기대한다. 다만 프리뷰는 아직 변경 가능성이 있어, 버전 업그레이드를 진행할 때마다 테스트 스위트를 재실행하기로 합의했다.",
      "팀은 또한 접근성 향상에 집중하려 한다. Stackflow의 전환 효과가 스크린 리더 사용자에게 혼란을 주지 않도록, ARIA 속성과 focus 이동 전략을 정교하게 설계한다. 이를 위해 접근성 전문가와 협업하여 전환 이벤트마다 적절한 안내를 제공하는 플러그인을 실험 중이다.",
      "끝으로 대규모 콘텐츠 환경에서의 메모리 사용량을 더 정밀하게 관찰할 계획이다. 현재는 Chrome DevTools 기반의 수동 측정이 많지만, 향후에는 CI 파이프라인에 메모리 회귀 테스트를 추가할 예정이다. Stackflow 스택 깊이가 120을 넘어가는 상황에서도 안정적으로 동작하는지를 장기적으로 검증한다.",
    ],
  },
];

const formatBytes = (value: number): string => {
  if (value < 1024) {
    return `${value.toLocaleString()} B`;
  }
  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }
  return `${(value / (1024 * 1024)).toFixed(2)} MB`;
};

const buildLargeArticle = (): GeneratedArticle => {
  const sections: ArticleSection[] = [];
  const encoder =
    typeof TextEncoder !== "undefined" ? new TextEncoder() : undefined;
  const encode = (value: string) =>
    encoder ? encoder.encode(value).length : value.length;

  let totalBytes = 0;
  let iteration = 0;

  while (totalBytes < TARGET_ARTICLE_BYTES) {
    BASE_ARTICLE_SECTIONS.forEach((baseSection, baseSectionIndex) => {
      if (totalBytes >= TARGET_ARTICLE_BYTES) {
        return;
      }

      const iterationLabel = iteration + 1;
      const sectionTitle = `${
        baseSection.heading
      } — 리서치 라운드 ${iterationLabel}.${baseSectionIndex + 1}`;
      const enrichedParagraphs = baseSection.paragraphs.map(
        (paragraph, paragraphIndex) => {
          const prefix = `라운드 ${iterationLabel} 인사이트 ${
            baseSectionIndex + 1
          }-${paragraphIndex + 1}: `;
          const suffix =
            " 이 내용을 바탕으로 실험군과 대조군의 체감 성능 차이를 기록하고 지연 구간을 재현 가능한 시나리오로 문서화했다.";
          return `${prefix}${paragraph}${suffix}`;
        }
      );

      const sectionBlob = [sectionTitle, ...enrichedParagraphs].join("\n");
      totalBytes += encode(sectionBlob);
      sections.push({
        id: `text-article-${iterationLabel}-${baseSectionIndex + 1}`,
        title: sectionTitle,
        paragraphs: enrichedParagraphs,
      });
    });

    iteration += 1;
  }

  return { sections, byteSize: totalBytes };
};

const parseStoredCount = (raw: string | null) => {
  if (!raw) {
    return 0;
  }
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
};

const readStoredCount = () => {
  if (typeof window === "undefined") {
    return 0;
  }
  return parseStoredCount(window.localStorage.getItem(TEXT_DISPATCH_COUNT_KEY));
};

const TextContentActivity: ActivityComponentType<
  TextContentActivityParams
> = () => {
  const { push } = useNavActions();
  const stack = useStack();
  const { stackCount: textStackCount } = useStackCount({
    activityName: "text",
  });
  const { queueStatus, enqueuePushes } = usePushQueue({
    activityName: "text",
  });

  // 성능 데이터 기록
  useEffect(() => {
    const memoryUsageMB = memoryUtils.getCurrentMemoryUsage();
    performanceTracker.recordPerformance({
      activityName: "text",
      memoryUsageMB,
      stackCount: textStackCount,
      stackDepth: stack.activities.length,
    });
  }, [textStackCount, stack.activities.length]);
  const [, setDispatchedCount] = useState<number>(() => readStoredCount());
  const { sections: articleSections, byteSize: articleByteSize } = useMemo(
    buildLargeArticle,
    []
  );
  const totalParagraphCount = useMemo(
    () =>
      articleSections.reduce(
        (acc, section) => acc + section.paragraphs.length,
        0
      ),
    [articleSections]
  );

  const updateDispatchedCount = useCallback((increment: number) => {
    if (increment === 0) {
      return;
    }
    setDispatchedCount((prev) => {
      const next = Math.max(prev + increment, 0);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(TEXT_DISPATCH_COUNT_KEY, next.toString(10));
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const handleStorage = (event: StorageEvent) => {
      if (event.key === TEXT_DISPATCH_COUNT_KEY) {
        setDispatchedCount(parseStoredCount(event.newValue));
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const pushCopies = useCallback(
    (count: number) => {
      if (count <= 0) {
        return;
      }
      enqueuePushes(count);
      updateDispatchedCount(count);
    },
    [enqueuePushes, updateDispatchedCount]
  );

  return (
    <AppScreen
      appBar={{
        title: "Article",
        renderRight: () => (
          // 홈으로
          <button type="button" onClick={() => push("home", {})}>
            홈으로
          </button>
        ),
      }}
    >
      <div className="activity">
        <section className="activity__header">
          <h1>일반 콘텐츠 페이지</h1>
          <p>
            무거운 메모리 스택 위에 올려서 전환 애니메이션과 스크롤 유지 동작을
            검증하기 위한 간단한 텍스트 화면입니다.
          </p>
          <p
            style={{
              marginTop: 16,
              fontWeight: 600,
              color: "#334155",
            }}
          >
            현재 텍스트 스택 수: {textStackCount.toLocaleString()}
          </p>
          <p
            style={{
              marginTop: 8,
              color: "#475569",
            }}
          >
            대용량 기사 섹션: {articleSections.length.toLocaleString()}개 ·
            문단: {totalParagraphCount.toLocaleString()}개 · 예상 텍스트 용량:{" "}
            {formatBytes(articleByteSize)}
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              alignItems: "center",
              marginTop: 12,
            }}
          >
            <button type="button" onClick={() => pushCopies(1)}>
              +1 Stack
            </button>
            <button type="button" onClick={() => pushCopies(10)}>
              +10 Stack
            </button>
            <button type="button" onClick={() => pushCopies(100)}>
              +100 Stack
            </button>
            <button type="button" onClick={() => pushCopies(1000)}>
              +1000 Stack
            </button>
          </div>
          {queueStatus ? (
            <p
              style={{
                marginTop: 8,
                color: "#475569",
              }}
            >
              배치 {queueStatus.batchId} • 완료 {queueStatus.dispatched}/
              {queueStatus.total}
              {queueStatus.remaining > 0
                ? ` • 대기 ${queueStatus.remaining}`
                : queueStatus.canceled
                ? " • 중단됨"
                : queueStatus.completed
                ? " • 완료됨"
                : null}
            </p>
          ) : null}
        </section>

        <div className="activity__content">
          <section className="activity__card">
            <h2>개요</h2>
            <p>
              이 페이지는 가벼운 UI 구성 요소만 포함하여 렌더링 자체에 큰 부담이
              없습니다. 대신 전형적인 기사 레이아웃과 유사한 구조를 담고 있어
              실제 사용자 흐름과 가까운 조건을 재현합니다.
            </p>
          </section>

          <section className="activity__card">
            <h2>본문</h2>
            <p>
              스택에 다수의 메모리 집중 활동이 존재하는 상태에서 이 화면으로
              전환해 애니메이션이 얼마나 부드러운지 확인해 보세요.
            </p>
            <p>
              동시에 스크롤을 여러 위치로 이동한 뒤 뒤로 가기와 앞으로 가기를
              반복하면 Stackflow가 기본적으로 제공하는 스크롤 복구 기능이
              유지되는지도 쉽게 관찰할 수 있습니다.
            </p>
            <p>
              실제 서비스 상황처럼 다양한 길이의 문단을 배치하고 텍스트 스타일만
              적용했기 때문에 DOM 노드 수가 최소화되어 있으며, 레이아웃 계산
              역시 간단하게 끝납니다.
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
              필요하다면 이 화면을 복제하여 다양한 길이나 구성의 텍스트 페이지를
              비교 실험에 사용할 수 있습니다. 예를 들어 헤더 이미지를
              추가하거나, 리스트 길이를 늘려서 레이아웃 확장을 재현할 수
              있습니다.
            </p>
          </section>

          <section className="activity__card">
            <h2>Stackflow 연구 로그</h2>
            <p>
              아래 대용량 텍스트는 Stackflow 전환 실험과 퍼포먼스 분석 과정을
              서술한 기록으로, 스택이 깊어졌을 때의 스크롤 유지와 렌더링 지연을
              관찰하기 위한 벤치마크 자료입니다. 약 1메가바이트 분량의 문단을
              포함하고 있으므로, 스택을 여러 번 쌓아 브라우저 메모리 사용량과
              전환 지연을 측정해 보세요.
            </p>
            <article className="activity__article">
              {articleSections.map((section) => (
                <section
                  key={section.id}
                  className="activity__article-section"
                  style={{ marginTop: 24 }}
                >
                  <h3>{section.title}</h3>
                  {section.paragraphs.map((paragraph, paragraphIndex) => (
                    <p key={`${section.id}-paragraph-${paragraphIndex}`}>
                      {paragraph}
                    </p>
                  ))}
                </section>
              ))}
            </article>
          </section>
        </div>
      </div>
    </AppScreen>
  );
};

export default TextContentActivity;
