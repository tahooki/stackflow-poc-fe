import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { StateSnapshotPanel } from "../../lib/dx-kit";
import "../PlaceholderPage.css";

/**
 * # StateSnapshotPanel 테스트 페이지
 *
 * ## 개요
 * StateSnapshotPanel은 애플리케이션의 현재 상태를 캡처하고 복원할 수 있는 디버깅 도구입니다.
 * 복잡한 UI 상태를 테스트하거나 특정 상태로 빠르게 돌아가야 할 때 유용합니다.
 *
 * ### 핵심 기능
 *
 * #### 1. 상태 스냅샷 캡처
 * - 현재 시점의 애플리케이션 상태를 JSON 형태로 저장합니다
 * - 타임스탬프와 라우트 정보가 자동으로 기록됩니다
 * - localStorage 데이터도 함께 캡처됩니다
 *
 * #### 2. 스냅샷 관리
 * - 최대 N개까지 스냅샷을 저장합니다 (기본값: 10개)
 * - 오래된 스냅샷은 자동으로 제거됩니다
 * - "Clear All" 버튼으로 모든 스냅샷을 한 번에 삭제할 수 있습니다
 *
 * #### 3. 상태 복원 (Integration Required)
 * - 저장된 스냅샷을 클릭하여 복원할 수 있습니다
 * - 실제 복원 기능은 Redux/Zustand 등의 상태 관리 라이브러리와 연동이 필요합니다
 * - 현재는 콘솔에 복원 데이터를 출력하고 alert를 표시합니다
 *
 * #### 4. 타임 트래블 디버깅
 * - 시간을 거슬러 올라가듯 이전 상태로 돌아갈 수 있습니다
 * - 버그 재현이나 상태 흐름 분석에 유용합니다
 *
 * ## Props
 *
 * ```typescript
 * interface StateSnapshotPanelProps {
 *   max?: number;  // 저장할 최대 스냅샷 개수 (기본값: 10)
 * }
 * ```
 *
 * ## 테스트 시나리오
 *
 * ### 시나리오 1: 단순 상태 캡처
 * - 카운터와 텍스트 입력 상태를 변경합니다
 * - Save 버튼으로 현재 상태를 스냅샷으로 저장합니다
 * - 여러 번 저장하여 스냅샷 목록을 확인합니다
 *
 * ### 시나리오 2: 복잡한 상태 캡처
 * - 폼 데이터, 선택된 옵션, 토글 상태 등을 조합합니다
 * - 다양한 상태 조합을 스냅샷으로 저장합니다
 *
 * ### 시나리오 3: localStorage 캡처
 * - localStorage에 데이터를 추가합니다
 * - 스냅샷에 localStorage가 포함되는지 확인합니다
 *
 * ### 시나리오 4: 최대 개수 제한
 * - max 설정값보다 많은 스냅샷을 저장합니다
 * - 오래된 스냅샷이 자동으로 제거되는지 확인합니다
 *
 * ### 시나리오 5: 스냅샷 복원 시뮬레이션
 * - Restore 버튼을 클릭하여 콘솔에서 스냅샷 데이터를 확인합니다
 * - 상태 관리 라이브러리와 연동하는 방법을 학습합니다
 *
 * ## 실제 프로젝트 통합 방법
 *
 * ### Redux와 연동
 * ```typescript
 * import { store } from './store';
 *
 * const restore = (snap: Snap) => {
 *   store.dispatch({ type: 'RESTORE_STATE', payload: snap.data });
 * };
 * ```
 *
 * ### Zustand와 연동
 * ```typescript
 * const useStore = create((set) => ({
 *   restoreSnapshot: (data) => set(data)
 * }));
 *
 * const restore = (snap: Snap) => {
 *   useStore.getState().restoreSnapshot(snap.data);
 * };
 * ```
 *
 * ### React Context와 연동
 * ```typescript
 * const restore = (snap: Snap) => {
 *   setAppState(snap.data);
 * };
 * ```
 *
 * ## 사용 사례
 * - 버그 재현: 문제가 발생한 상태를 저장하고 반복 테스트
 * - QA 협업: 특정 상태를 공유하여 팀원이 같은 상태에서 테스트
 * - 복잡한 폼 테스트: 긴 폼을 매번 처음부터 채우지 않고 중간 상태로 빠르게 이동
 * - 상태 디버깅: 상태 변화 흐름을 추적하고 분석
 */

export const StateSnapshotTestPage = () => {
  const [maxSnapshots, setMaxSnapshots] = useState(10);

  // 시나리오 1: 단순 상태
  const [simpleCount, setSimpleCount] = useState(0);
  const [simpleText, setSimpleText] = useState("");

  // 시나리오 2: 복잡한 상태
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    age: 25,
    country: "KR",
    newsletter: false,
    interests: [] as string[],
  });

  // 시나리오 3: localStorage
  const [localStorageKey, setLocalStorageKey] = useState("");
  const [localStorageValue, setLocalStorageValue] = useState("");
  const [localStorageItems, setLocalStorageItems] = useState<string[]>([]);

  useEffect(() => {
    updateLocalStorageList();
  }, []);

  const updateLocalStorageList = () => {
    const keys = Object.keys(localStorage);
    setLocalStorageItems(keys);
  };

  const addToLocalStorage = () => {
    if (localStorageKey && localStorageValue) {
      localStorage.setItem(localStorageKey, localStorageValue);
      updateLocalStorageList();
      setLocalStorageKey("");
      setLocalStorageValue("");
    }
  };

  const removeFromLocalStorage = (key: string) => {
    localStorage.removeItem(key);
    updateLocalStorageList();
  };

  // 시나리오 4: 동적 컴포넌트 생성
  const [dynamicBoxes, setDynamicBoxes] = useState<
    Array<{ id: string; color: string; x: number; y: number }>
  >([]);

  const addRandomBox = () => {
    const colors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];
    const newBox = {
      id: Math.random().toString(36).slice(2),
      color: colors[Math.floor(Math.random() * colors.length)],
      x: Math.random() * 80,
      y: Math.random() * 60,
    };
    setDynamicBoxes([...dynamicBoxes, newBox]);
  };

  const clearBoxes = () => {
    setDynamicBoxes([]);
  };

  const updateFormData = (field: keyof typeof formData, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const toggleInterest = (interest: string) => {
    const interests = formData.interests.includes(interest)
      ? formData.interests.filter((i) => i !== interest)
      : [...formData.interests, interest];
    updateFormData("interests", interests);
  };

  // 현재 상태 요약
  const getCurrentState = () => {
    return {
      simpleCount,
      simpleText,
      formData,
      dynamicBoxes: dynamicBoxes.length,
      localStorageKeys: Object.keys(localStorage).length,
    };
  };

  return (
    <div
      className="placeholder-page"
      style={{ minHeight: "150vh", paddingBottom: 100 }}
    >
      {/* StateSnapshotPanel 활성화 */}
      <StateSnapshotPanel max={maxSnapshots} />

      <div className="placeholder-container" style={{ maxWidth: 1200 }}>
        <div className="placeholder-icon">📸</div>
        <h1>StateSnapshot 상태 스냅샷 테스트</h1>
        <p className="placeholder-description">
          애플리케이션 상태를 캡처하고 복원하는 타임 트래블 디버깅 도구
        </p>

        {/* 패널 설정 */}
        <div
          style={{
            background: "#eff6ff",
            border: "2px solid #3b82f6",
            borderRadius: 12,
            padding: 24,
            marginBottom: 30,
          }}
        >
          <h2 style={{ marginTop: 0 }}>⚙️ 패널 설정</h2>

          <div style={{ marginBottom: 16 }}>
            <label
              style={{ display: "block", marginBottom: 8, fontWeight: 600 }}
            >
              최대 스냅샷 개수: {maxSnapshots}
            </label>
            <input
              type="range"
              min="3"
              max="20"
              value={maxSnapshots}
              onChange={(e) => setMaxSnapshots(Number(e.target.value))}
              style={{ width: "100%", maxWidth: 400 }}
            />
            <small>
              이 개수를 초과하면 오래된 스냅샷이 자동으로 제거됩니다
            </small>
          </div>

          <div
            style={{
              padding: 16,
              background: "#fff",
              borderRadius: 8,
              border: "1px solid #3b82f6",
            }}
          >
            <strong>💡 사용 방법:</strong>
            <ol style={{ marginTop: 8, marginBottom: 0, lineHeight: 1.8 }}>
              <li>아래 시나리오들과 상호작용하여 상태를 변경합니다</li>
              <li>좌측 하단의 "Save" 버튼을 클릭하여 현재 상태를 저장합니다</li>
              <li>
                여러 상태를 저장한 후 "Restore" 버튼으로 복원을 시도합니다
              </li>
              <li>콘솔을 열어 스냅샷 데이터 구조를 확인합니다</li>
            </ol>
          </div>
        </div>

        {/* 현재 상태 요약 */}
        <div
          style={{
            background: "#f0fdf4",
            border: "2px solid #10b981",
            borderRadius: 12,
            padding: 24,
            marginBottom: 30,
          }}
        >
          <h2 style={{ marginTop: 0 }}>📊 현재 상태 요약</h2>
          <pre
            style={{
              background: "#1e293b",
              color: "#e2e8f0",
              padding: 16,
              borderRadius: 8,
              overflow: "auto",
              fontSize: 13,
            }}
          >
            {JSON.stringify(getCurrentState(), null, 2)}
          </pre>
          <small>
            👆 이 데이터가 스냅샷에 저장됩니다. 좌측 하단에서 "Save" 버튼을
            눌러보세요!
          </small>
        </div>

        {/* 시나리오 1: 단순 상태 */}
        <div style={{ marginBottom: 30 }}>
          <h2>🎯 시나리오 1: 단순 상태 캡처</h2>
          <p>
            카운터와 텍스트 입력 상태를 변경하고 스냅샷으로 저장합니다.
            <br />
            <strong>테스트:</strong> 값을 변경한 후 좌측 하단의 "Save" 버튼을
            클릭하세요.
          </p>

          <div
            style={{
              background: "#fef3c7",
              border: "2px solid #f59e0b",
              borderRadius: 12,
              padding: 24,
            }}
          >
            <h3 style={{ marginTop: 0 }}>Simple Counter & Text</h3>

            <div style={{ marginBottom: 20 }}>
              <label
                style={{ display: "block", marginBottom: 8, fontWeight: 600 }}
              >
                카운터: {simpleCount}
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setSimpleCount(simpleCount + 1)}>
                  +1
                </button>
                <button onClick={() => setSimpleCount(simpleCount + 5)}>
                  +5
                </button>
                <button onClick={() => setSimpleCount(simpleCount - 1)}>
                  -1
                </button>
                <button onClick={() => setSimpleCount(0)}>Reset</button>
              </div>
            </div>

            <div>
              <label
                style={{ display: "block", marginBottom: 8, fontWeight: 600 }}
              >
                텍스트:
              </label>
              <input
                type="text"
                value={simpleText}
                onChange={(e) => setSimpleText(e.target.value)}
                placeholder="여기에 입력하세요..."
                style={{ padding: 8, width: "100%", maxWidth: 400 }}
              />
            </div>
          </div>

          <details style={{ marginTop: 16 }}>
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>
              📝 테스트 절차
            </summary>
            <ol style={{ marginTop: 12, lineHeight: 1.8 }}>
              <li>카운터를 10으로 증가시키고, 텍스트에 "상태1"을 입력합니다</li>
              <li>좌측 하단의 "Save" 버튼을 클릭합니다</li>
              <li>카운터를 20으로 증가시키고, 텍스트를 "상태2"로 변경합니다</li>
              <li>다시 "Save" 버튼을 클릭합니다</li>
              <li>패널에 두 개의 스냅샷이 저장된 것을 확인합니다</li>
              <li>
                "Restore" 버튼을 클릭하여 콘솔에서 저장된 데이터를 확인합니다
              </li>
            </ol>
          </details>
        </div>

        {/* 시나리오 2: 복잡한 폼 상태 */}
        <div style={{ marginBottom: 30 }}>
          <h2>📋 시나리오 2: 복잡한 폼 상태 캡처</h2>
          <p>
            여러 입력 필드, 선택 박스, 체크박스가 포함된 복잡한 상태를
            관리합니다.
            <br />
            <strong>사용 사례:</strong> 긴 폼을 테스트할 때 매번 처음부터 채우지
            않고 중간 상태로 복원할 수 있습니다.
          </p>

          <div
            style={{
              background: "#dbeafe",
              border: "2px solid #3b82f6",
              borderRadius: 12,
              padding: 24,
            }}
          >
            <h3 style={{ marginTop: 0 }}>사용자 등록 폼</h3>

            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <label
                  style={{ display: "block", marginBottom: 4, fontWeight: 600 }}
                >
                  이름:
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateFormData("name", e.target.value)}
                  placeholder="홍길동"
                  style={{ padding: 8, width: "100%" }}
                />
              </div>

              <div>
                <label
                  style={{ display: "block", marginBottom: 4, fontWeight: 600 }}
                >
                  이메일:
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData("email", e.target.value)}
                  placeholder="example@email.com"
                  style={{ padding: 8, width: "100%" }}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 4,
                      fontWeight: 600,
                    }}
                  >
                    나이: {formData.age}
                  </label>
                  <input
                    type="range"
                    min="18"
                    max="100"
                    value={formData.age}
                    onChange={(e) =>
                      updateFormData("age", Number(e.target.value))
                    }
                    style={{ width: "100%" }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 4,
                      fontWeight: 600,
                    }}
                  >
                    국가:
                  </label>
                  <select
                    value={formData.country}
                    onChange={(e) => updateFormData("country", e.target.value)}
                    style={{ padding: 8, width: "100%" }}
                  >
                    <option value="KR">대한민국</option>
                    <option value="US">미국</option>
                    <option value="JP">일본</option>
                    <option value="CN">중국</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.newsletter}
                    onChange={(e) =>
                      updateFormData("newsletter", e.target.checked)
                    }
                    style={{ marginRight: 8 }}
                  />
                  <span>뉴스레터 수신 동의</span>
                </label>
              </div>

              <div>
                <label
                  style={{ display: "block", marginBottom: 8, fontWeight: 600 }}
                >
                  관심사:
                </label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {["개발", "디자인", "마케팅", "데이터", "PM"].map(
                    (interest) => (
                      <button
                        key={interest}
                        onClick={() => toggleInterest(interest)}
                        style={{
                          padding: "6px 12px",
                          background: formData.interests.includes(interest)
                            ? "#3b82f6"
                            : "#fff",
                          color: formData.interests.includes(interest)
                            ? "#fff"
                            : "#000",
                          border: "1px solid #3b82f6",
                          borderRadius: 6,
                          cursor: "pointer",
                        }}
                      >
                        {interest}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: 20,
                padding: 12,
                background: "#fff",
                borderRadius: 6,
              }}
            >
              <strong>현재 폼 데이터:</strong>
              <pre style={{ fontSize: 11, marginTop: 8 }}>
                {JSON.stringify(formData, null, 2)}
              </pre>
            </div>
          </div>

          <details style={{ marginTop: 16 }}>
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>
              📝 테스트 절차
            </summary>
            <ol style={{ marginTop: 12, lineHeight: 1.8 }}>
              <li>폼의 일부 필드만 채웁니다 (예: 이름, 이메일만)</li>
              <li>"Save" 버튼으로 이 상태를 저장합니다 → 스냅샷 A</li>
              <li>나머지 필드도 모두 채웁니다</li>
              <li>다시 "Save" 버튼으로 완전한 상태를 저장합니다 → 스냅샷 B</li>
              <li>페이지를 새로고침합니다 (폼이 초기화됨)</li>
              <li>스냅샷 목록을 확인하고 "Restore"를 클릭합니다</li>
              <li>실제 프로젝트에서는 이 시점에 폼 상태가 복원됩니다</li>
            </ol>
          </details>
        </div>

        {/* 시나리오 3: localStorage 통합 */}
        <div style={{ marginBottom: 30 }}>
          <h2>💾 시나리오 3: localStorage 캡처</h2>
          <p>
            스냅샷에는 localStorage 데이터도 자동으로 포함됩니다.
            <br />
            <strong>활용:</strong> 인증 토큰, 사용자 설정 등 localStorage에
            저장된 데이터도 함께 복원할 수 있습니다.
          </p>

          <div
            style={{
              background: "#fce7f3",
              border: "2px solid #ec4899",
              borderRadius: 12,
              padding: 24,
            }}
          >
            <h3 style={{ marginTop: 0 }}>localStorage 관리</h3>

            <div style={{ marginBottom: 20 }}>
              <label
                style={{ display: "block", marginBottom: 4, fontWeight: 600 }}
              >
                새 항목 추가:
              </label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input
                  type="text"
                  value={localStorageKey}
                  onChange={(e) => setLocalStorageKey(e.target.value)}
                  placeholder="Key"
                  style={{ padding: 8, flex: 1, minWidth: 150 }}
                />
                <input
                  type="text"
                  value={localStorageValue}
                  onChange={(e) => setLocalStorageValue(e.target.value)}
                  placeholder="Value"
                  style={{ padding: 8, flex: 1, minWidth: 150 }}
                />
                <button
                  onClick={addToLocalStorage}
                  style={{
                    padding: "8px 16px",
                    background: "#ec4899",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                  }}
                >
                  추가
                </button>
              </div>
            </div>

            <div>
              <strong>
                현재 localStorage 항목 ({localStorageItems.length}개):
              </strong>
              <div
                style={{
                  marginTop: 8,
                  maxHeight: 200,
                  overflow: "auto",
                  background: "#fff",
                  borderRadius: 6,
                  padding: 12,
                }}
              >
                {localStorageItems.length === 0 ? (
                  <div style={{ color: "#6b7280", fontSize: 14 }}>
                    localStorage가 비어 있습니다
                  </div>
                ) : (
                  localStorageItems.map((key) => (
                    <div
                      key={key}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 0",
                        borderBottom: "1px solid #f3f4f6",
                      }}
                    >
                      <div
                        style={{
                          flex: 1,
                          fontFamily: "monospace",
                          fontSize: 13,
                        }}
                      >
                        <strong>{key}:</strong>{" "}
                        {localStorage.getItem(key)?.slice(0, 50)}
                        {(localStorage.getItem(key)?.length || 0) > 50 && "..."}
                      </div>
                      <button
                        onClick={() => removeFromLocalStorage(key)}
                        style={{
                          marginLeft: 8,
                          padding: "4px 8px",
                          background: "#ef4444",
                          color: "#fff",
                          border: "none",
                          borderRadius: 4,
                          cursor: "pointer",
                          fontSize: 12,
                        }}
                      >
                        삭제
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <details style={{ marginTop: 16 }}>
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>
              📝 테스트 절차
            </summary>
            <ol style={{ marginTop: 12, lineHeight: 1.8 }}>
              <li>
                localStorage에 몇 개의 항목을 추가합니다 (예: theme=dark,
                lang=ko)
              </li>
              <li>"Save" 버튼으로 스냅샷을 저장합니다</li>
              <li>localStorage 항목을 몇 개 삭제하거나 수정합니다</li>
              <li>다시 "Save" 버튼으로 변경된 상태를 저장합니다</li>
              <li>"Restore" 버튼을 클릭하고 콘솔을 확인합니다</li>
              <li>localStorage 객체가 스냅샷에 포함된 것을 확인합니다</li>
            </ol>
          </details>
        </div>

        {/* 시나리오 4: 동적 UI 상태 */}
        <div style={{ marginBottom: 30 }}>
          <h2>🎨 시나리오 4: 동적 UI 상태 캡처</h2>
          <p>
            사용자 인터랙션으로 생성된 동적 요소들의 상태를 캡처합니다.
            <br />
            <strong>활용:</strong> 캔버스 앱, 대시보드 레이아웃, 드래그 앤 드롭
            상태 등을 저장할 수 있습니다.
          </p>

          <div
            style={{
              background: "#e9d5ff",
              border: "2px solid #8b5cf6",
              borderRadius: 12,
              padding: 24,
            }}
          >
            <h3 style={{ marginTop: 0 }}>Dynamic Boxes Canvas</h3>

            <div style={{ marginBottom: 16 }}>
              <button
                onClick={addRandomBox}
                style={{
                  padding: "12px 24px",
                  background: "#8b5cf6",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  marginRight: 8,
                  fontSize: 16,
                  fontWeight: 600,
                }}
              >
                ➕ 랜덤 박스 추가
              </button>
              <button
                onClick={clearBoxes}
                style={{
                  padding: "12px 24px",
                  background: "#ef4444",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 16,
                }}
              >
                🗑️ 모두 삭제
              </button>
              <span
                style={{
                  marginLeft: 16,
                  padding: "8px 16px",
                  background: "#fff",
                  borderRadius: 6,
                  fontWeight: 600,
                }}
              >
                박스 개수: {dynamicBoxes.length}
              </span>
            </div>

            <div
              style={{
                position: "relative",
                height: 400,
                background: "#fff",
                borderRadius: 8,
                overflow: "hidden",
                border: "2px dashed #8b5cf6",
              }}
            >
              {dynamicBoxes.map((box) => (
                <div
                  key={box.id}
                  style={{
                    position: "absolute",
                    left: `${box.x}%`,
                    top: `${box.y}%`,
                    width: 60,
                    height: 60,
                    background: box.color,
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 12,
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                  }}
                >
                  {box.id.slice(0, 4)}
                </div>
              ))}
              {dynamicBoxes.length === 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    color: "#9ca3af",
                    fontSize: 18,
                  }}
                >
                  "랜덤 박스 추가" 버튼을 클릭하세요
                </div>
              )}
            </div>
          </div>

          <details style={{ marginTop: 16 }}>
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>
              📝 테스트 절차
            </summary>
            <ol style={{ marginTop: 12, lineHeight: 1.8 }}>
              <li>
                "랜덤 박스 추가" 버튼을 여러 번 클릭하여 박스를 생성합니다
              </li>
              <li>마음에 드는 레이아웃이 만들어지면 "Save"로 저장합니다</li>
              <li>계속해서 박스를 추가하거나 "모두 삭제"를 클릭합니다</li>
              <li>다른 레이아웃을 만들고 또 저장합니다</li>
              <li>
                여러 스냅샷을 저장한 후 "Restore"로 이전 레이아웃을 확인합니다
              </li>
              <li>실제 프로젝트에서는 복원 시 박스들이 다시 그려집니다</li>
            </ol>
          </details>
        </div>

        {/* 시나리오 5: 최대 개수 제한 테스트 */}
        <div style={{ marginBottom: 30 }}>
          <h2>🔢 시나리오 5: 최대 개수 제한 테스트</h2>
          <p>
            설정한 max 값을 초과하면 오래된 스냅샷이 자동으로 제거됩니다.
            <br />
            <strong>테스트:</strong> max를 3으로 설정하고 5번 이상 저장해보세요.
          </p>

          <div
            style={{
              background: "#fed7aa",
              border: "2px solid #f97316",
              borderRadius: 12,
              padding: 24,
            }}
          >
            <h3 style={{ marginTop: 0 }}>빠른 스냅샷 생성</h3>
            <p>
              현재 max 설정: <strong>{maxSnapshots}</strong>개
            </p>
            <button
              onClick={() => {
                // 상태를 약간 변경하고 스냅샷 저장을 트리거
                setSimpleCount((c) => c + 1);
                setTimeout(() => {
                  alert(
                    `스냅샷을 저장하려면 좌측 하단의 "Save" 버튼을 클릭하세요!\n` +
                      `현재 simpleCount: ${simpleCount + 1}\n\n` +
                      `이 버튼을 여러 번 클릭한 후 각각 Save하여\n` +
                      `max 제한이 작동하는지 테스트해보세요.`
                  );
                }, 100);
              }}
              style={{
                padding: "12px 24px",
                background: "#f97316",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              상태 변경 + Save 안내
            </button>
          </div>

          <details style={{ marginTop: 16 }}>
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>
              📝 테스트 절차
            </summary>
            <ol style={{ marginTop: 12, lineHeight: 1.8 }}>
              <li>상단의 "최대 스냅샷 개수" 슬라이더를 3으로 설정합니다</li>
              <li>좌측 하단의 "Save" 버튼을 5번 이상 클릭합니다</li>
              <li>스냅샷 목록에 최대 3개만 남아있는지 확인합니다</li>
              <li>
                가장 오래된 스냅샷이 자동으로 제거되었는지 타임스탬프로
                확인합니다
              </li>
              <li>max 값을 10으로 늘리고 다시 테스트합니다</li>
            </ol>
          </details>
        </div>

        {/* 실제 프로젝트 통합 가이드 */}
        <div
          style={{
            background: "#f0fdf4",
            border: "2px solid #10b981",
            borderRadius: 12,
            padding: 24,
            marginBottom: 30,
          }}
        >
          <h2 style={{ marginTop: 0 }}>🔌 실제 프로젝트 통합 가이드</h2>

          <p>
            현재 StateSnapshotPanel은 스냅샷 저장까지만 구현되어 있습니다. 실제
            복원 기능은 프로젝트의 상태 관리 라이브러리와 연동이 필요합니다.
          </p>

          <h3>Redux와 통합</h3>
          <pre
            style={{
              background: "#1e293b",
              color: "#e2e8f0",
              padding: 16,
              borderRadius: 8,
              overflow: "auto",
              fontSize: 13,
            }}
          >
            {`// snapshot-panel.tsx 수정
import { store } from './store';

const restore = (snap: Snap) => {
  // Redux store에 상태 복원
  store.dispatch({
    type: 'RESTORE_SNAPSHOT',
    payload: snap.data
  });
};

// reducer에서 처리
case 'RESTORE_SNAPSHOT':
  return action.payload;`}
          </pre>

          <h3>Zustand와 통합</h3>
          <pre
            style={{
              background: "#1e293b",
              color: "#e2e8f0",
              padding: 16,
              borderRadius: 8,
              overflow: "auto",
              fontSize: 13,
            }}
          >
            {`// store.ts
import { create } from 'zustand';

const useStore = create((set) => ({
  // ... 상태들
  restoreSnapshot: (data) => set(data)
}));

// snapshot-panel.tsx
const restore = (snap: Snap) => {
  useStore.getState().restoreSnapshot(snap.data);
};`}
          </pre>

          <h3>React Context와 통합</h3>
          <pre
            style={{
              background: "#1e293b",
              color: "#e2e8f0",
              padding: 16,
              borderRadius: 8,
              overflow: "auto",
              fontSize: 13,
            }}
          >
            {`// AppContext.tsx
export const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, setState] = useState(initialState);
  
  const restoreSnapshot = (data) => {
    setState(data);
  };
  
  return (
    <AppContext.Provider value={{ state, restoreSnapshot }}>
      {children}
    </AppContext.Provider>
  );
}

// snapshot-panel.tsx에서 사용
const { restoreSnapshot } = useContext(AppContext);

const restore = (snap: Snap) => {
  restoreSnapshot(snap.data);
};`}
          </pre>

          <h3>커스터마이즈된 캡처</h3>
          <pre
            style={{
              background: "#1e293b",
              color: "#e2e8f0",
              padding: 16,
              borderRadius: 8,
              overflow: "auto",
              fontSize: 13,
            }}
          >
            {`// 현재는 간단한 데이터만 캡처하지만, 
// 실제 프로젝트에서는 더 많은 정보를 담을 수 있습니다

const capture = () => {
  const data = {
    timestamp: Date.now(),
    pathname: location.pathname,
    
    // Redux store
    reduxState: store.getState(),
    
    // React Query cache
    queryCache: queryClient.getQueryCache(),
    
    // localStorage
    localStorage: { ...localStorage },
    
    // sessionStorage
    sessionStorage: { ...sessionStorage },
    
    // Custom app state
    appState: getAppState(),
    
    // User info
    user: getCurrentUser(),
  };
  
  const snap: Snap = {
    id: Math.random().toString(36).slice(2),
    at: Date.now(),
    route: location.pathname,
    data,
  };
  
  setSnaps((arr) => [snap, ...arr].slice(0, max));
};`}
          </pre>
        </div>

        {/* 사용 팁 */}
        <div
          style={{
            background: "#fef3c7",
            border: "2px solid #f59e0b",
            borderRadius: 12,
            padding: 24,
            marginBottom: 30,
          }}
        >
          <h2 style={{ marginTop: 0 }}>💡 활용 팁</h2>
          <ul style={{ lineHeight: 1.8 }}>
            <li>
              <strong>버그 재현:</strong> 버그가 발생한 정확한 상태를 저장하고,
              개발자나 QA가 같은 상태에서 시작하여 문제를 재현할 수 있습니다.
            </li>
            <li>
              <strong>복잡한 폼 테스트:</strong> 긴 다단계 폼을 테스트할 때 매번
              처음부터 입력하지 않고 중간 단계로 빠르게 이동할 수 있습니다.
            </li>
            <li>
              <strong>A/B 테스트:</strong> 두 가지 다른 상태를 저장하고 빠르게
              전환하며 UI/UX를 비교할 수 있습니다.
            </li>
            <li>
              <strong>데모 준비:</strong> 데모나 프레젠테이션을 위한 특정 상태를
              미리 준비해두고 즉시 로드할 수 있습니다.
            </li>
            <li>
              <strong>개발 워크플로우:</strong> 특정 기능을 개발할 때 해당
              기능을 테스트하기 좋은 상태를 저장해두고 반복 사용할 수 있습니다.
            </li>
            <li>
              <strong>타임 트래블 디버깅:</strong> 상태 변화의 흐름을 추적하고,
              특정 시점으로 돌아가 문제가 언제 시작되었는지 파악할 수 있습니다.
            </li>
          </ul>
        </div>

        <Link to="/dx-kit" className="placeholder-back-link">
          ← DX Kit 허브로 돌아가기
        </Link>
      </div>
    </div>
  );
};
