import { Card, CardContent } from '@/components/ui/card'

export default function Tools() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-10 space-y-5">
      <div className="pt-4 md:pt-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">工具</h1>
        <p className="text-muted-foreground mt-1">实用小工具</p>
      </div>
      <Card className="shadow-none border">
        <CardContent className="p-8 flex flex-col items-center justify-center min-h-[200px]">
          <i data-lucide="settings" className="w-12 h-12 text-muted-foreground mb-4"></i>
          <p className="text-muted-foreground text-sm">工具列表暂未开放，敬请期待</p>
        </CardContent>
      </Card>
    </div>
  )
}
