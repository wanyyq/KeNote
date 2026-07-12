import { useState, useRef } from "react"
import { useStore } from "@/store/useStore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export default function Console() {
  const { bills, exportAllData, importData } = useStore()
  const [st, setSt] = useState<{t:"success"|"error";m:string}|null>(null)
  const ref = useRef<HTMLInputElement>(null)
  const ti = bills.filter(b=>b.type==="income").reduce((a,b)=>a+b.amount,0)
  const te = bills.filter(b=>b.type==="expense").reduce((a,b)=>a+b.amount,0)

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-10 space-y-5">
      <div className="pt-4 md:pt-8"><h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">控制台</h1><p className="text-muted-foreground mt-1">软件信息与设置</p></div>
      <Card>
        <CardHeader><CardTitle>关于 KeNote</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {[["版本","1.0.0"],["技术栈","React 19 + Vite + Shadcn UI"],["账单总数",`${bills.length} 条`],["累计收入",`¥${ti.toFixed(2)}`,"text-emerald-600"],["累计支出",`¥${te.toFixed(2)}`,"text-red-500"],["账户结余",`¥${(ti-te).toFixed(2)}`,ti-te>=0?"":"text-red-500"]].map(([l,v,c],i)=><div key={l}><div className="flex justify-between py-1"><span className="text-muted-foreground">{l}</span><span className={c||""}>{v}</span></div>{i<5&&<Separator/>}</div>)}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>数据管理</CardTitle><CardDescription>导出与导入记账数据</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between"><div><p className="text-sm font-medium">导出所有数据</p><p className="text-xs text-muted-foreground mt-0.5">将全部账单记录导出为 JSON 文件</p></div><Button variant="outline" size="sm" onClick={()=>{const j=exportAllData();const b=new Blob([j],{type:"application/json"});const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download=`KeNote_backup_${new Date().toISOString().slice(0,10)}.json`;document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(u)}}>导出</Button></div>
          <Separator/>
          <div className="flex items-center justify-between"><div><p className="text-sm font-medium">导入数据</p><p className="text-xs text-muted-foreground mt-0.5">从导出的 JSON 文件恢复账单，自动合并不重复的数据</p></div><div><input ref={ref} type="file" accept=".json" className="hidden" id="if" onChange={e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>{try{const t=ev.target?.result as string;const x=importData(t);setSt(x.success?{t:"success",m:`导入成功！合并了 ${x.merged} 条记录，跳过 ${x.skipped} 条重复`}:{t:"error",m:"导入失败：数据格式不正确"})}catch{setSt({t:"error",m:"导入失败：无法解析文件"})}};r.readAsText(f);ref.current&&(ref.current.value="")}}/><Button variant="outline" size="sm" onClick={()=>ref.current?.click()}>导入</Button></div></div>
          {st&&<div className={`text-sm p-3 rounded-md ${st.t==="success"?"bg-emerald-50 text-emerald-700":"bg-red-50 text-destructive"}`}>{st.m}</div>}
        </CardContent>
      </Card>
    </div>
  )
}
