import { useMemo, useState } from "react";
import BitLayout, { type BitField } from "./viz/BitLayout";
import RbGrid, { type RbSection } from "./viz/RbGrid";
import BeamView from "./viz/BeamView";
import MessageSequence from "./viz/MessageSequence";
import { SECTION_TYPES, SECTION_EXTENSIONS } from "../data/curated";
import { buildScenarioForSectionType, buildScenarioForExtension } from "../lib/scenarios";

/**
 * Interactive playground: pick a Section Type + Extensions, see all four
 * visualizations adapt together.
 */
export default function Playground() {
  const [stId, setStId] = useState(1);
  const [selected, setSelected] = useState<number[]>([1, 6]);

  const meta = SECTION_TYPES.find((s) => s.id === stId)!;
  const stScenario = useMemo(() => buildScenarioForSectionType(stId), [stId]);
  const stColors = useMemo(() => Object.fromEntries(SECTION_TYPES.map((s) => [s.id, s.color])), []);
  const seColors = useMemo(() => Object.fromEntries(SECTION_EXTENSIONS.map((s) => [s.id, s.color])), []);

  const allowedExts = useMemo(
    () => SECTION_EXTENSIONS.filter((se) => se.appliesToSectionTypes.includes(stId)),
    [stId]
  );

  const toggle = (id: number) =>
    setSelected((arr) => (arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]));

  // Compose bit layout: ST base + each selected extension payload
  const composedBits: BitField[] = useMemo(() => {
    const out: BitField[] = [...stScenario.bitLayout];
    for (const id of selected) {
      const meta = SECTION_EXTENSIONS.find((s) => s.id === id);
      if (!meta) continue;
      const ext = buildScenarioForExtension(id);
      out.push({
        name: `——SE${id}——`,
        bits: 8,
        description: `SE${id} ${meta.name} 시작 (extType=${id})`,
        color: meta.color,
      });
      for (const f of ext.bitLayout.slice(3)) {
        out.push({ ...f, color: f.color || meta.color });
      }
    }
    return out;
  }, [stScenario.bitLayout, selected]);

  // Compose RB grid: ST sections plus an overlay for any SE that adds spatial info
  const composedRb: RbSection[] = useMemo(() => {
    const out = [...stScenario.rbSections];
    for (const id of selected) {
      const meta = SECTION_EXTENSIONS.find((s) => s.id === id);
      if (!meta) continue;
      if (["prb-allocation", "frequency"].some((k) => meta.affects.includes(k as any))) {
        const ext = buildScenarioForExtension(id);
        for (const s of ext.rbSections) {
          out.push({ ...s, id: `${s.id}-se${id}`, color: meta.color });
        }
      }
    }
    return out;
  }, [stScenario.rbSections, selected]);

  // Compose beam: start from ST defaults, then SE 1/2/11/14/19 etc tweak
  const composedBeam = useMemo(() => {
    let { N, steer, nulls, taper, ues } = stScenario.beam;
    for (const id of selected) {
      const ext = buildScenarioForExtension(id);
      if (id === 1) {
        steer = ext.beam.steer;
        N = Math.max(N, 16);
      }
      if (id === 2) steer = ext.beam.steer;
      if (id === 11) N = Math.max(N, 32);
      if (id === 14) nulls = ext.beam.nulls;
      if (id === 8) taper = Math.max(taper, 6);
      if (id === 29) taper = Math.max(taper, 4);
    }
    return { N, steer, nulls, taper, ues };
  }, [stScenario.beam, selected]);

  // Compose sequence: base from ST plus any SE that has a feedback step (e.g., 22)
  const composedSeq = useMemo(() => {
    const out = [...stScenario.sequence];
    for (const id of selected) {
      if (id === 22) {
        out.push({
          from: "O-RU",
          to: "O-DU",
          label: "ST8 ACK/NACK",
          st: 8,
          note: "SE22로 응답을 요청했기 때문에 ST8(ACK/NACK feedback) 응답이 발생",
        });
      }
      if (id === 27 || id === 28) {
        out.unshift({
          from: "O-DU",
          to: "O-RU",
          label: "차원/해상도 지시",
          st: stId,
          ses: [id],
          note: "O-DU가 채널 보고의 정보량을 조절",
        });
      }
    }
    return out;
  }, [stScenario.sequence, selected, stId]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-ink-200 dark:border-ink-700 p-4 bg-white dark:bg-ink-900">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-sm font-semibold mr-2">Section Type</span>
          {SECTION_TYPES.filter((s) => !s.id || s.id !== 2).map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setStId(s.id);
                setSelected([]);
              }}
              className={`text-xs font-mono px-2 py-1 rounded transition ${stId === s.id ? "ring-2 ring-offset-1" : ""}`}
              style={{
                background: stId === s.id ? s.color : s.color + "1f",
                color: stId === s.id ? "white" : s.color,
              }}
            >
              ST{s.id}
            </button>
          ))}
        </div>
        <div className="text-sm text-ink-600 dark:text-ink-300 mb-3">{meta.intent}</div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold mr-2">Section Extensions</span>
          {allowedExts.length === 0 ? (
            <span className="text-xs text-ink-500">이 Section Type은 일반적으로 Extension을 붙이지 않습니다.</span>
          ) : (
            allowedExts.map((se) => {
              const on = selected.includes(se.id);
              return (
                <button
                  key={se.id}
                  onClick={() => toggle(se.id)}
                  className={`text-xs font-mono px-2 py-1 rounded transition ${on ? "ring-2 ring-offset-1" : ""}`}
                  style={{
                    background: on ? se.color : se.color + "1f",
                    color: on ? "white" : se.color,
                  }}
                  title={se.name}
                >
                  SE{se.id}
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <RbGrid sections={composedRb} caption="ST + 선택한 SE가 어떤 자원을 차지/표시하는지" />
        <BeamView
          numAntennas={composedBeam.N}
          steerDeg={composedBeam.steer}
          nullDegs={composedBeam.nulls}
          taperDb={composedBeam.taper}
          ues={composedBeam.ues}
          caption="SE 1/2/11 → 빔 방향·폭, SE 14 → 널, SE 8 → 정규화"
        />
      </div>
      <BitLayout
        title={`비트 레이아웃: ST${stId}` + (selected.length ? ` + ${selected.map((s) => `SE${s}`).join(", ")}` : "")}
        fields={composedBits}
        caption="Extension은 호스트 Section 뒤에 ef=1을 따라 이어 붙는 식으로 직렬화됩니다."
      />
      <MessageSequence steps={composedSeq} stColors={stColors} seColors={seColors} />
    </div>
  );
}
