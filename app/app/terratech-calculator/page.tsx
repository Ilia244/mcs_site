'use client'
import { useEffect, useState } from 'react';

type Resource = { name: string; refined: number };
type Data = { corps: Record<string, number>; resources: Resource[] };
type ListItem = { corp: string; name: string; amt: number };

const defaultData: Data = {
  corps: { GSO: 24, GEO: 120, VEN: 8, HE: 64, BF: 42 },
  resources: [
    { name: "木材", refined: 6 },
    { name: "フィブロンの塊", refined: 9 },
    { name: "高密度フィブロンの塊", refined: 14 },
    { name: "ゴム樹脂", refined: 12 },
    { name: "ゴムレンガ", refined: 18 },
    { name: "ルクサイトの破片", refined: 15 },
    { name: "ルクサイトの結晶", refined: 23 },
    { name: "メタリウム鉱石", refined: 18 },
    { name: "メタリウムインゴット", refined: 27 },
    { name: "チタナイト鉱石", refined: 20 },
    { name: "チタナイトインゴット", refined: 30 },
    { name: "カーボナイト繊維", refined: 30 },
    { name: "カーボナイト高密度繊維", refined: 45 },
    { name: "カーバイトレンガ", refined: 75 },
    { name: "ローダイト鉱石", refined: 55 },
    { name: "ローダイトカプセル", refined: 83 },
    { name: "オレイト樹脂", refined: 60 },
    { name: "オレイトレンガ", refined: 90 },
    { name: "イグナイトの破片", refined: 150 },
    { name: "イグナイトの結晶", refined: 225 },
    { name: "エルダイトの破片", refined: 155 },
    { name: "エルダイトの結晶", refined: 233 },
    { name: "セレスタイトの破片", refined: 160 },
    { name: "セレスタイトの結晶", refined: 240 },
  ],
};

export default function TerraCalc() {
  const [data, setData] = useState<Data>(defaultData);
  const [list, setList] = useState<ListItem[]>([]);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [autoCombine, setAutoCombine] = useState(false);
  const [mode, setMode] = useState<'block' | 'raw'>('block');
  const [selectedCorp, setSelectedCorp] = useState(Object.keys(defaultData.corps)[0]);
  const [selectedRes, setSelectedRes] = useState(defaultData.resources[0].name);
  const [amount, setAmount] = useState(1);

  // localStorage読み込み
  useEffect(() => {
    const stored = localStorage.getItem('tt_calc_data');
    if (stored) setData(JSON.parse(stored));
  }, []);

  // localStorage保存
  useEffect(() => {
    localStorage.setItem('tt_calc_data', JSON.stringify(data));
  }, [data]);

  // リセット
  const resetData = () => {
    if (!confirm("データを初期化してリセットします。よろしいですか？")) return;
    localStorage.removeItem('tt_calc_data');
    setData(JSON.parse(JSON.stringify(defaultData)));
    setList([]);
    setEditIndex(null);
    setAutoCombine(false);
    setMode('block');
    setSelectedCorp(Object.keys(defaultData.corps)[0]);
    setSelectedRes(defaultData.resources[0].name);
    setAmount(1);
  };

  const addOrUpdate = () => {
    if (!amount || amount <= 0) return;
    const item = { corp: selectedCorp, name: selectedRes, amt: amount };
    if (editIndex === null) setList([...list, item]);
    else {
      const newList = [...list];
      newList[editIndex] = item;
      setList(newList);
      setEditIndex(null);
    }
    setAmount(1);
  };

  const removeItem = (i: number) => {
    const newList = [...list];
    newList.splice(i, 1);
    setList(newList);
  };

  const editItem = (i: number) => {
    const item = list[i];
    setEditIndex(i);
    setSelectedCorp(item.corp);
    setSelectedRes(item.name);
    setAmount(item.amt);
  };

  const manualCombine = () => {
    const combined: Record<string, ListItem> = {};
    list.forEach(item => {
      const key = `${item.corp}_${item.name}`;
      if (!combined[key]) combined[key] = { ...item };
      else combined[key].amt += item.amt;
    });
    setList(Object.values(combined));
  };

  const toggleAutoCombine = () => setAutoCombine(!autoCombine);

  const getCombinedList = () => {
    const combined: Record<string, ListItem> = {};
    list.forEach(item => {
      const key = `${item.corp}_${item.name}`;
      if (!combined[key]) combined[key] = { ...item };
      else combined[key].amt += item.amt;
    });
    return Object.values(combined);
  };

  const displayList = autoCombine ? getCombinedList() : list;

  const summaryHtml = () => {
    const summary: Record<string, { res: number; val: number }> = {};
    displayList.forEach(item => {
      const r = data.resources.find(x => x.name === item.name);
      const blockSize = data.corps[item.corp];
      if (!summary[item.corp]) summary[item.corp] = { res: 0, val: 0 };
      if (mode === 'block') summary[item.corp].res += item.amt * blockSize, summary[item.corp].val += item.amt * blockSize * r!.refined;
      else summary[item.corp].res += item.amt;
    });
    return Object.entries(summary).map(([corp, { res, val }]) => (
      <p key={corp}>
        {mode === 'block'
          ? `${corp} → 総資源:${res} / 売却:${val}`
          : `${corp} → 総資源:${res} / ブロック:${Math.floor(res / data.corps[corp])} / 余り:${res % data.corps[corp]}`}
      </p>
    ));
  };

  return (
    <div style={{ padding: 20, background: '#111', color: '#eee', fontFamily: 'sans-serif' }}>
      <h1>TerraTech 計算機（localStorage版）</h1>

      <div style={{ background: '#222', padding: 10, border: '1px solid #555', marginBottom: 15 }}>
        <h2>計算モード</h2>
        <select value={mode} onChange={e => setMode(e.target.value as 'block' | 'raw')}>
          <option value="block">資源ブロック計算</option>
          <option value="raw">資源合計計算</option>
        </select>
        <br />
        企業:
        <select value={selectedCorp} onChange={e => setSelectedCorp(e.target.value)}>
          {Object.keys(data.corps).map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        資源:
        <select value={selectedRes} onChange={e => setSelectedRes(e.target.value)}>
          {data.resources.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
        </select>
        個数:
        <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} />
        <button onClick={addOrUpdate}>{editIndex === null ? '追加' : '更新'}</button>
        <button onClick={manualCombine}>手動合算</button>
        <button onClick={toggleAutoCombine}>自動合算: {autoCombine ? 'オン' : 'オフ'}</button>
        <button onClick={resetData}>リセット</button>
      </div>

      <h2>合計</h2>
      <div style={{ background: '#222', padding: 10, border: '1px solid #555', marginBottom: 15 }}>
        {summaryHtml()}
      </div>

      <h2>入力リスト</h2>
      <table style={{ borderCollapse: 'collapse', marginTop: 10, width: '100%' }}>
        <thead>
          <tr>
            <th>企業</th><th>資源</th><th>個数</th><th>操作</th>
          </tr>
        </thead>
        <tbody>
          {displayList.map((item, i) => (
            <tr key={i}>
              <td>{item.corp}</td>
              <td>{item.name}</td>
              <td>{item.amt}</td>
              <td>
                <button onClick={() => editItem(i)}>編集</button>
                <button onClick={() => removeItem(i)}>削除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}