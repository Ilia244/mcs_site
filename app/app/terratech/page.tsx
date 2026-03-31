"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import styles from "./style.module.css"

// Supabase のテーブルに合わせた型定義
type CorpData = { id: number; name: string; block_size: number }
type ResourceData = { id: number; name: string; refined_price: number }
type InputItem = { id: number; corp: string; name: string; amt: number; resource_id: number }

export default function TerraTechCalc() {
  const [corps, setCorps] = useState<CorpData[]>([])
  const [resources, setResources] = useState<ResourceData[]>([])
  const [list, setList] = useState<InputItem[]>([])
  const [corpSelect, setCorpSelect] = useState("")
  const [resourceSelect, setResourceSelect] = useState("")
  const [amount, setAmount] = useState<number>(1)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [autoCombine, setAutoCombine] = useState<boolean>(false)
  const [mode, setMode] = useState<"block" | "raw">("block")
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const init = async () => {
      try {
        // 企業データ
        const { data: corpsData, error: corpsError } = await supabase.from<CorpData>("corps").select("*")
        if (corpsError) throw corpsError
        if (corpsData) {
          setCorps(corpsData)
          setCorpSelect(corpsData[0]?.name || "")
        }

        // 資源データ
        const { data: resData, error: resError } = await supabase.from<ResourceData>("resources").select("*")
        if (resError) throw resError
        if (resData) {
          setResources(resData)
          setResourceSelect(resData[0]?.name || "")
        }

        // 入力リスト
        const { data: listData, error: listError } = await supabase.from("input_list").select("*")
        if (listError) throw listError
        if (listData) {
          const mapped: InputItem[] = listData.map(l => {
            const res = resData?.find(r => r.id === l.resource_id)
            return {
              id: l.id,
              corp: l.corp_name,
              resource_id: l.resource_id,
              name: res?.name || "",
              amt: l.amount
            }
          })
          setList(mapped)
        }

      } catch (e) {
        console.error(e)
      }
      setLoading(false)
    }
    init()
  }, [])

  if (loading) return <p>読み込み中...</p>

  const addOrUpdate = async () => {
    if (!amount || amount <= 0) return
    const res = resources.find(r => r.name === resourceSelect)
    if (!res) return

    if (editIndex === null) {
      const { data, error } = await supabase.from("input_list")
        .insert([{ corp_name: corpSelect, resource_id: res.id, amount }])
        .select("*")
      if (error) return console.error(error)
      if (data && data[0]) {
        setList([...list, { id: data[0].id, corp: corpSelect, name: resourceSelect, amt: amount, resource_id: res.id }])
      }
    } else {
      const item = list[editIndex]
      const { error } = await supabase.from("input_list").update({ amount }).eq("id", item.id)
      if (error) return console.error(error)
      const newList = [...list]
      newList[editIndex].amt = amount
      setList(newList)
      setEditIndex(null)
    }
    setAmount(1)
  }

  const removeItem = async (i: number) => {
    const item = list[i]
    const { error } = await supabase.from("input_list").delete().eq("id", item.id)
    if (error) return console.error(error)
    const newList = [...list]
    newList.splice(i, 1)
    setList(newList)
  }

  const editItem = (i: number) => {
    setEditIndex(i)
    setCorpSelect(list[i].corp)
    setResourceSelect(list[i].name)
    setAmount(list[i].amt)
  }

  const toggleAutoCombine = () => setAutoCombine(!autoCombine)

  const getDisplayList = (): InputItem[] => {
    if (!autoCombine) return list
    const combined: Record<string, InputItem> = {}
    list.forEach(item => {
      const key = item.corp + "_" + item.name
      if (!combined[key]) combined[key] = { ...item }
      else combined[key].amt += item.amt
    })
    return Object.values(combined)
  }

  const calcSummary = () => {
    const displayList = getDisplayList()
    const summary: Record<string, { res: number; val: number }> = {}
    displayList.forEach(item => {
      const price = resources.find(r => r.name === item.name)?.refined_price || 0
      const blockSize = corps.find(c => c.name === item.corp)?.block_size || 1
      if (!summary[item.corp]) summary[item.corp] = { res: 0, val: 0 }
      if (mode === "block") {
        summary[item.corp].res += item.amt * blockSize
        summary[item.corp].val += item.amt * blockSize * price
      } else {
        summary[item.corp].res += item.amt
      }
    })
    return summary
  }

  return (
    <main className={styles.container}>
      <h1 className={styles.title}>TerraTech 計算機</h1>

      <div className={styles.modeSelector}>
        <label>
          計算モード:
          <select value={mode} onChange={e => setMode(e.target.value as "block" | "raw")} className={styles.select}>
            <option value="block">資源ブロック計算</option>
            <option value="raw">資源合計計算</option>
          </select>
        </label>
      </div>

      <div className={styles.inputRow}>
        <select value={corpSelect} onChange={e => setCorpSelect(e.target.value)} className={styles.select}>
          {corps.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>

        <select value={resourceSelect} onChange={e => setResourceSelect(e.target.value)} className={styles.select}>
          {resources.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
        </select>

        <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value) || 0)} className={styles.input} />

        <button onClick={addOrUpdate} className={`${styles.button} ${styles.btnAdd}`}>
          {editIndex === null ? "追加" : "更新"}
        </button>
        <button onClick={toggleAutoCombine} className={`${styles.button} ${styles.btnCombine}`}>
          自動合算: {autoCombine ? "オン" : "オフ"}
        </button>
      </div>

      <div className={styles.summary}>
        <h2>合計</h2>
        {Object.entries(calcSummary()).map(([corp, s]) => {
          const blockSize = corps.find(c => c.name === corp)?.block_size || 1
          return mode === "block"
            ? <p key={corp}>{corp} → 総資源: {s.res} / 売却: {s.val}</p>
            : <p key={corp}>{corp} → 総資源: {s.res} / ブロック: {Math.floor(s.res / blockSize)} / 余り: {s.res % blockSize}</p>
        })}
      </div>

      <div className={styles.listContainer}>
        <h2>入力リスト</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>企業</th><th>資源</th><th>個数</th><th>操作</th>
            </tr>
          </thead>
          <tbody>
            {getDisplayList().map((item, i) => (
              <tr key={i}>
                <td>{item.corp}</td>
                <td>{item.name}</td>
                <td>{item.amt}</td>
                <td>
                  <button onClick={() => editItem(i)} className={`${styles.button} ${styles.btnEdit}`}>編集</button>
                  <button onClick={() => removeItem(i)} className={`${styles.button} ${styles.btnDelete}`}>削除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}