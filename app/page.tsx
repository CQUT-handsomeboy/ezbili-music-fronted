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
import { createContext, useContext } from "react"
import { extract } from "@/lib/regex"
import { toast } from "sonner"

import type { Selection } from "react-aria-components"

interface Item {
  id: number;
  label: string;
  description: string;
}

enum RegexMode {
  TitleRegexAndArtistRegex = 1,
  TitleRegexAndOneArtist = 2,
}


const RegexContext = createContext<{
  songsOriginal: Item[];
  setSongsFiltered: React.Dispatch<React.SetStateAction<Item[]>>
}>({
  songsOriginal: [],
  setSongsFiltered: () => { }
})

function RegexSheet() {
  const [mode, setMode] = useState<RegexMode>(RegexMode.TitleRegexAndOneArtist)
  const { songsOriginal, setSongsFiltered } = useContext(RegexContext)
  const [titleRegex, setTitleRegex] = useState<string>("")
  const [artist, setArtist] = useState<string>("")
  const [artistRegex, setArtistRegex] = useState<string>("")
  return <Sheet>
    <Button intent="outline">匹配规则</Button>
    <Sheet.Content>
      <Sheet.Header>
        <Sheet.Title>设置规则</Sheet.Title>
        <Sheet.Description>统一设置作者，然后使用正则表达式设置标题的匹配规则。</Sheet.Description>
      </Sheet.Header>
      <Sheet.Body className="space-y-4">
        <TextField label="标题<正则>" type="text" placeholder="输入匹配标题的正则表达式"
          value={titleRegex} onChange={setTitleRegex} />
        <Button intent="secondary" onClick={() => setTitleRegex("《([^》]+)》")}>{"书名号规则"}</Button>
        <Button intent="secondary" onClick={() => setTitleRegex("")}>{"整个"}</Button>
        {mode == RegexMode.TitleRegexAndArtistRegex && <>
          <TextField label="歌手<正则>" type="text" placeholder="输入匹配歌手的正则表达式" value={artistRegex} onChange={setArtistRegex} />
          <Button intent="secondary">{"空格到书名号开始"}</Button>
        </>}
        {mode == RegexMode.TitleRegexAndOneArtist && <TextField label="歌手<名字>" type="text" placeholder="输入歌手的名字" value={artist} onChange={setArtist} />}

        <Switch isSelected={mode == RegexMode.TitleRegexAndOneArtist} onChange={(isSelected: boolean) => isSelected ? setMode(RegexMode.TitleRegexAndOneArtist) : setMode(RegexMode.TitleRegexAndArtistRegex)}>使用统一歌手</Switch>
      </Sheet.Body>
      <Sheet.Footer>
        <Button intent="outline" type="submit"
          onClick={() => setSongsFiltered(songsOriginal)}
        >
          还原
        </Button>
        <Button intent="primary" type="submit"
          onClick={() => {
            switch (mode) {
              case RegexMode.TitleRegexAndOneArtist:
                if (artist == "")
                  return
                setSongsFiltered(songsOriginal.map(song => ({
                  id: song.id,
                  label: extract(titleRegex, song.label),
                  description: artist,
                })))
                break;
              case RegexMode.TitleRegexAndArtistRegex:
                setSongsFiltered(songsOriginal.map(song => ({
                  id: song.id,
                  label: extract(titleRegex, song.label),
                  description: extract(artistRegex, song.label),
                })))
                break;
            }
          }}
        >
          应用
        </Button>
      </Sheet.Footer>
    </Sheet.Content>
  </Sheet>
}

export default function Home() {
  const [searchbar, setSearchbar] = useState<string>("")
  const [songsFiltered, setSongsFiltered] = useState<Item[]>([]) // 正则表达式处理过后的
  const [songsOriginal, setSongsOriginal] = useState<Item[]>([])
  const [allSelected, setAllSelected] = useState<boolean>(false)
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]))
  const BVid = useRef<string>(null)
  const idTocid = useRef<Map<number, number>>(new Map())

  useEffect(() => {
    if (allSelected)
      setSelectedKeys(new Set(songsFiltered.map((song) => song.id)))
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
            if (searchbar === "") {
              toast.error("输入链接")
              return
            }
            fetch(new URL("https://api.xiaoyin.link/metadata"), {
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
                BVid.current = data.meta.bvid as string
                const pages: { cid: number, part: string, page: number }[] = data.meta.videoData.pages
                setSongsOriginal(pages.map((page) => {
                  idTocid.current.set(page.page, page.cid)
                  page.page
                  page.cid
                  return {
                    id: page.page,
                    label: page.part,
                    description: "佚名",
                    bvid: "",
                    cid: page.cid
                  }
                }))
                setSongsFiltered(songsOriginal)
              })
          }}>查找</Button>}
        />
        <Toolbar aria-label="Toolbars">
          <Toolbar.Group aria-label="download selections">
            <Toolbar.Item aria-label="select all" size="square-petite" intent="outline" onChange={(isSelected: boolean) => setAllSelected(isSelected)}>
              <IconChecklist />
            </Toolbar.Item>
            <Toolbar.Separator />
            <Button intent="outline"
              onClick={() => {
                if (selectedKeys instanceof Set && selectedKeys.size == 0) {
                  toast.error("选择要下载的歌曲")
                  return
                }

                if (selectedKeys instanceof Set) {
                  for (const id of selectedKeys) {
                    const index = parseInt(id.toString()) - 1
                    const { description: artist, label: title } = songsOriginal[index]

                  }
                }
              }}
            >下载选中项</Button>
            <RegexContext.Provider value={{ songsOriginal, setSongsFiltered }}>
              <RegexSheet />
            </RegexContext.Provider>
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
          items={songsFiltered}
        >
          {(item) => <Choicebox.Item className="max-h-[75px]" {...item} />}
        </Choicebox>

      </div>
    </div >
  );
} 
