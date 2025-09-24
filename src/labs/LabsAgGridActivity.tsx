import { AppScreen } from "@stackflow/plugin-basic-ui";
import type { ActivityComponentType } from "@stackflow/react";
import { useMemo } from "react";

import { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-community";

import { scenarioDefinitions } from "../scenarios";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

type ScenarioRow = {
  scenarioId: string;
  title: string;
  description: string;
  flagLabel: string;
  entryActivityId: string;
  entryRoute: string;
  activityCount: number;
  activityTitles: string;
};

const LABS_AG_GRID_ACTIVITY_NAME = "labs.agGrid";

const LabsAgGridActivity: ActivityComponentType = () => {
  const rows = useMemo<ScenarioRow[]>(
    () =>
      scenarioDefinitions.map((scenario) => ({
        scenarioId: scenario.id,
        title: scenario.title,
        description: scenario.description,
        flagLabel: scenario.flagLabel,
        entryActivityId: scenario.entry.activityId,
        entryRoute: `/${scenario.id}/${scenario.entry.activityId}`,
        activityCount: scenario.activities.length,
        activityTitles: scenario.activities
          .map((activity) => `${activity.id} · ${activity.activityTitle}`)
          .join("\n"),
      })),
    [],
  );

  const columnDefs = useMemo<ColDef<ScenarioRow>[]>(
    () => [
      {
        field: "scenarioId",
        headerName: "Scenario ID",
        minWidth: 180,
      },
      {
        field: "title",
        headerName: "Title",
        minWidth: 220,
      },
      {
        field: "flagLabel",
        headerName: "Flag",
        minWidth: 120,
      },
      {
        field: "activityCount",
        headerName: "Activities",
        minWidth: 120,
        sortable: true,
      },
      {
        field: "entryRoute",
        headerName: "Entry Path",
        minWidth: 200,
      },
      {
        field: "activityTitles",
        headerName: "Activities (ID · Title)",
        minWidth: 280,
      },
      {
        field: "description",
        headerName: "Description",
        flex: 1,
      },
    ],
    [],
  );

  const defaultColDef = useMemo<ColDef<ScenarioRow>>(
    () => ({
      sortable: true,
      filter: true,
      floatingFilter: true,
      resizable: true,
      wrapHeaderText: true,
      autoHeaderHeight: true,
    }),
    [],
  );

  const summary = useMemo(
    () => {
      const totalActivities = scenarioDefinitions.reduce(
        (sum, scenario) => sum + scenario.activities.length,
        0,
      );
      const uniqueFlags = new Set(
        scenarioDefinitions.map((scenario) => scenario.flagLabel),
      );
      return {
        scenarioCount: scenarioDefinitions.length,
        totalActivities,
        flagVariantCount: uniqueFlags.size,
      };
    },
    [],
  );

  return (
    <AppScreen appBar={{ title: "Labs · Scenario Matrix" }}>
      <div className="labs-ag-grid">
        <header className="labs-ag-grid__intro">
          <h1>Scenario Reference Table</h1>
          <p>
            Stackflow 기본 시나리오를 AG Grid 형태로 정리했습니다. 필터와 정렬을
            활용해 빠르게 상태를 점검하세요.
          </p>
        </header>

        <section className="labs-ag-grid__stats">
          <article>
            <span className="labs-ag-grid__stat-label">등록된 시나리오</span>
            <strong>{summary.scenarioCount}</strong>
          </article>
          <article>
            <span className="labs-ag-grid__stat-label">총 Activity 수</span>
            <strong>{summary.totalActivities}</strong>
          </article>
          <article>
            <span className="labs-ag-grid__stat-label">Nav Flag 변형</span>
            <strong>{summary.flagVariantCount}</strong>
          </article>
        </section>

        <section className="labs-ag-grid__grid ag-theme-quartz">
          <AgGridReact<ScenarioRow>
            rowData={rows}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            pagination
            paginationPageSize={6}
          />
        </section>
      </div>
    </AppScreen>
  );
};

LabsAgGridActivity.displayName = "LabsAgGridActivity";

// eslint-disable-next-line react-refresh/only-export-components
export { LabsAgGridActivity, LABS_AG_GRID_ACTIVITY_NAME };
