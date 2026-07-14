import { useState, useRef } from "react"
import { useStore } from "@/store/useStore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import CategoryIcon from "@/components/bills/CategoryIcon"
import IconPicker from "@/components/bills/IconPicker"
import { BillType } from "@/store/useStore"

export default function Console() {
  const { bills, exportAllData, importData, replaceAllData, getAllCategories, removeCustomCategory, addCustomCategory, customExpenseCategories, customIncomeCategories } = useStore()
  const [mergeStatus, setMergeStatus] = useState<{t:"success"|"error";m:string}|null>(null)
  const [replaceStatus, setReplaceStatus] = useState<{t:"success"|"error";m:string}|null>(null)
  const [replaceConfirmOpen, setReplaceConfirmOpen] = useState(false)
  const [pendingReplaceData, setPendingReplaceData] = useState<string | null>(null)
  const mergeRef = useRef<HTMLInputElement>(null)
  const replaceRef = useRef<HTMLInputElement>(null)

  // Add tag state
  const [addTagOpen, setAddTagOpen] = useState(false)
  const [tagName, setTagName] = useState("")
  const [tagType, setTagType] = useState<BillType>("expense")
  const [tagIcon, setTagIcon] = useState("circle")
  const [ipOpen, setIpOpen] = useState(false)

  const ti = bills.filter(b=>b.type==="income").reduce((a,b)=>a+b.amount,0)
  const te = bills.filter(b=>b.type==="expense").reduce((a,b)=>a+b.amount,0)
  const allCustom = [...customExpenseCategories.map(c => ({...c, type: 'expense' as const})), ...customIncomeCategories.map(c => ({...c, type: 'income' as const}))]

  const handleExport = () => {
    const j = exportAllData(); const b = new Blob([j],{type:"application/json"}); const u = URL.createObjectURL(b)
    const a = document.createElement("a"); a.href=u; a.download=`KeNote_backup_${new Date().toISOString().slice(0,10)}.json`
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(u)
  }
  const handleMergeImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if(!f) return; const r = new FileReader()
    r.onload = ev => { try { const t = ev.target?.result as string; const x=importData(t); setMergeStatus(x.success?{t:"success",m:`合并了 ${x.merged} 条，跳过 ${x.skipped} 条`}:{t:"error",m:"数据格式不正确"}) } catch { setMergeStatus({t:"error",m:"无法解析文件"}) } }
    r.readAsText(f); if(mergeRef.current) mergeRef.current.value = ""
  }
  const handleReplaceImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if(!f) return; const r = new FileReader()
    r.onload = ev => { try { setPendingReplaceData(ev.target?.result as string); setReplaceConfirmOpen(true) } catch {} }
    r.readAsText(f); if(replaceRef.current) replaceRef.current.value = ""
  }
  const confirmReplace = () => {
    if (!pendingReplaceData) return; const x = replaceAllData(pendingReplaceData)
    setReplaceStatus(x.success ? {t:"success",m:`已导入 ${x.count} 条记录`} : {t:"error",m:"数据格式不正确"})
    setPendingReplaceData(null); setReplaceConfirmOpen(false)
  }

  const addTag = () => {
    if(!tagName.trim()) return
    addCustomCategory(tagType, {name:tagName.trim(),icon:tagIcon,isCustom:true})
    setTagName(""); setTagIcon("circle"); setAddTagOpen(false)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-10 space-y-5">
      <div className="pt-4 md:pt-8"><h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">控制台</h1><p className="text-muted-foreground mt-1">账户、信息与设置</p></div>

      {/* About */}
      <Card>
        <CardHeader><CardTitle>About KeNote</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {[["软件版本","1.0.1"],["为您记录",`${bills.length} 条账单`],["累计收入",`¥${ti.toFixed(2)}`,"text-emerald-600"],["累计支出",`¥${te.toFixed(2)}`,"text-red-500"],["账户结余",`¥${(ti-te).toFixed(2)}`,ti-te>=0?"":"text-red-500"]].map(([l,v,c],i)=><div key={l}><div className="flex justify-between py-1"><span className="text-muted-foreground">{l}</span><span className={c||""}>{v}</span></div>{i<5&&<Separator/>}</div>)}
        </CardContent>
      </Card>

      {/* Tags & Categories */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div><CardTitle>标签与分类</CardTitle><CardDescription>管理自定义标签</CardDescription></div>
          <Button variant="outline" size="sm" onClick={() => setAddTagOpen(!addTagOpen)}><i data-lucide="plus" className="size-3.5 mr-1"></i>添加</Button>
        </CardHeader>
        <CardContent>
          {addTagOpen && (
            <div className="flex items-center gap-2 mb-3 p-3 border rounded-md bg-muted/30">
              <button onClick={() => setIpOpen(true)} className="shrink-0 p-1.5 rounded-md border hover:bg-accent"><CategoryIcon iconName={tagIcon} size={16}/></button>
              <Select value={tagType} onValueChange={v => setTagType(v as BillType)}><SelectTrigger className="w-[80px] h-8 text-xs"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="expense">支出</SelectItem><SelectItem value="income">收入</SelectItem></SelectContent></Select>
              <Input placeholder="分类名称" value={tagName} onChange={e=>setTagName(e.target.value)} className="h-8 text-xs flex-1" onKeyDown={e=>{if(e.key==="Enter")addTag()}} />
              <Button size="sm" onClick={addTag} disabled={!tagName.trim()} className="h-8 text-xs">确定</Button>
              <Button variant="ghost" size="icon-xs" onClick={()=>{setAddTagOpen(false);setTagName("");setTagIcon("circle")}}><i data-lucide="x" className="size-3"/></Button>
            </div>
          )}
          {allCustom.length === 0 && !addTagOpen ? (
            <p className="text-sm text-muted-foreground py-2">暂无自定义标签</p>
          ) : (
            <div className="space-y-1">
              {allCustom.map(c => (
                <div key={c.name} className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-accent/50">
                  <div className="flex items-center gap-2"><CategoryIcon iconName={c.icon} size={16}/><span className="text-sm">{c.name}</span><span className="text-xs text-muted-foreground">({c.type==="expense"?"支出":"收入"})</span></div>
                  <Button variant="ghost" size="icon-xs" onClick={()=>removeCustomCategory(c.type,c.name)}><i data-lucide="x" className="size-3.5"/></Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account */}
      <Card>
        <CardHeader><CardTitle>账户</CardTitle><CardDescription>本地账户数据(您的数据完全存储在本地)</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between"><div><p className="text-sm font-medium">导出账户数据</p><p className="text-xs text-muted-foreground mt-0.5">完整备份用户的数据,或用于迁移数据到新的设备</p></div><Button variant="outline" size="sm" onClick={handleExport}><i data-lucide="download" className="size-3.5 mr-1.5"></i>导出</Button></div>
          <Separator />
          <div><div className="flex items-center justify-between mb-2"><div><p className="text-sm font-medium">导入新账户数据</p><p className="text-xs text-red-500 mt-0.5">⚠ 此功能用于完整地将旧设备的数据迁移到此设备,将会完全替换此设备所有数据</p></div><input ref={replaceRef} type="file" accept=".json" className="hidden" id="rpf" onChange={handleReplaceImport}/><Button variant="destructive" size="sm" onClick={()=>replaceRef.current?.click()}><i data-lucide="upload" className="size-3.5 mr-1.5"></i>导入用户数据 </Button></div>{replaceStatus&&<div className={`text-xs p-2 rounded-md ${replaceStatus.t==="success"?"bg-emerald-50 text-emerald-700":"bg-red-50 text-destructive"}`}>{replaceStatus.m}</div>}</div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader><CardTitle>设备同步</CardTitle><CardDescription>在多个设备同步账单数据</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between"><div><p className="text-sm font-medium">导出账单数据</p><p className="text-xs text-muted-foreground mt-0.5">请将导出的文件复制到您的其他安装此软件的设备上,然后点击"导入合并数据"</p></div><Button variant="outline" size="sm" onClick={handleExport}><i data-lucide="download" className="size-3.5 mr-1.5"></i>导出同步数据</Button></div>
          <Separator />
          <div><div className="flex items-center justify-between mb-2"><div><p className="text-sm font-medium">导入合并数据</p><p className="text-xs text-muted-foreground mt-0.5">将多分账单合并到一起</p></div><input ref={mergeRef} type="file" accept=".json" className="hidden" id="mgf" onChange={handleMergeImport}/><Button variant="outline" size="sm" onClick={()=>mergeRef.current?.click()}><i data-lucide="upload" className="size-3.5 mr-1.5"></i>合并同步数据</Button></div>{mergeStatus&&<div className={`text-xs p-2 rounded-md ${mergeStatus.t==="success"?"bg-emerald-50 text-emerald-700":"bg-red-50 text-destructive"}`}>{mergeStatus.m}</div>}</div>
        </CardContent>
      </Card>

      {/* Replace Confirm AlertDialog */}
      <AlertDialog open={replaceConfirmOpen} onOpenChange={setReplaceConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>⚠ 导入新账户数据</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>导入用户不是合并数据。</p><p>导入数据将会将此设备数据完全替换为导入的数据。</p><p>若想将另一个数据合并到一起，请使用下方「数据管理」→「导入数据（合并）」来合并。</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white hover:bg-gray-50">取消</AlertDialogCancel>
            <Button variant="outline" onClick={() => setReplaceConfirmOpen(false)} className="text-muted-foreground">合并</Button>
            <AlertDialogAction onClick={confirmReplace} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">确定导入新数据</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <IconPicker open={ipOpen} selected={tagIcon} onSelect={n => { setTagIcon(n); setIpOpen(false) }} onClose={() => setIpOpen(false)} />
    </div>
  )
}
