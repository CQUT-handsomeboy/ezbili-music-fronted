"use client"

import { TextField } from "@/components/ui/text-field"
import { Button } from "@/components/ui/button"
import { Choicebox } from "@/components/ui/choicebox"
import { Toolbar } from "@/components/ui/toolbar"
import { IconChecklist } from "@intentui/icons"
import { useEffect, useRef, useState } from "react"
import { Sheet } from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { ProgressBar } from "@/components/ui/progress-bar"

import type { Selection } from "react-aria-components"

interface Item {
  id: number;
  label: string;
  description: string;
}

function RegexSheet() {
  // <regex-for-title-and-artist> 1
  // <regex-for-title-only-and-one-artist> 2
  const [mode, setMode] = useState<number>(2)
  return <Sheet>
    <Button intent="outline">匹配规则</Button>
    <Sheet.Content>
      <Sheet.Header>
        <Sheet.Title>设置规则</Sheet.Title>
        <Sheet.Description>统一设置作者，然后使用正则表达式设置标题的匹配规则。</Sheet.Description>
      </Sheet.Header>
      <Sheet.Body className="space-y-4">
        <TextField label="标题<正则>" type="text" placeholder="输入匹配标题的正则表达式" />
        <Button intent="secondary">{"《${title}》"}</Button>
        {mode == 1 && <>
          <TextField label="歌手<正则>" type="text" placeholder="输入匹配歌手的正则表达式" />
          <Button intent="secondary">{"<space>${artist}《"}</Button>
        </>}
        {mode == 2 && <TextField label="歌手<名字>" type="text" placeholder="输入歌手的名字" />}

        <Switch isSelected={mode == 2} onChange={(isSelected: boolean) => isSelected ? setMode(2) : setMode(1)}>使用统一歌手</Switch>
      </Sheet.Body>
      <Sheet.Footer>
        <Button intent="outline" type="submit">
          检查
        </Button>
        <Button intent="primary" type="submit">
          保存
        </Button>
      </Sheet.Footer>
    </Sheet.Content>
  </Sheet>
}

export default function Home() {
  const [searchbar, setSearchbar] = useState<string>("")
  const [songs, setSongs] = useState<Item[]>([])
  const [allSelected, setAllSelected] = useState<boolean>(false)
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]))

  useEffect(() => {
    if (allSelected)
      setSelectedKeys(new Set(songs.map((song) => song.id)))
    else
      setSelectedKeys(new Set([]))
  }, [allSelected])

  return (
    <div className="flex min-h-screen flex-row items-center justify-center md:px-0">
      <div className="space-y-3 w-full md:max-w-[500px] px-3 md:mx-auto">
        <TextField
          name="name"
          type="text"
          label="粘贴Blibili MV视频链接"
          placeholder="https://www.bilibili.com/video/BV1YmFPe4EnY"
          value={searchbar}
          onChange={(value: string) => setSearchbar(value)}
          suffix={<Button onClick={() => {
            console.log(searchbar)
            const api = new URL("https://api.xiaoyin.link/")
            fetch(api, {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                url: searchbar
              })
            })
              .then((response) => response.json())
              .then((data) => {
                console.log(data);
              })
          }}>查找</Button>}
        />
        <Toolbar aria-label="Toolbars">
          <Toolbar.Group aria-label="download selections">
            <Toolbar.Item aria-label="select all" size="square-petite" intent="outline" onChange={(isSelected: boolean) => setAllSelected(isSelected)}>
              <IconChecklist />
            </Toolbar.Item>
            <Toolbar.Separator />
            <Button intent="outline">下载选中项</Button>
            <RegexSheet />

          </Toolbar.Group>

        </Toolbar>
        <ProgressBar label="下载进度" value={25} />
        <Choicebox
          className="mx-auto w-full h-[500px] border p-2 overflow-y-auto"
          selectionMode="multiple"
          selectedKeys={selectedKeys}
          onSelectionChange={setSelectedKeys}
          aria-label="Select"
          gap={0}
          columns={1}
          items={songs}
        >
          {(item) => <Choicebox.Item {...item} />}
        </Choicebox>

      </div>
    </div >
  );
} 
