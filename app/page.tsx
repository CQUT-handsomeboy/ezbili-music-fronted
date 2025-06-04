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
import { LineShadowText } from "@/components/magicui/line-shadow-text";

import { Link, type Selection } from "react-aria-components"

interface Item {
  id: number;
  label: string;
  description: string;
}

enum ArtistRegexMode {
  OneArtist = 0b00, // 指定统一艺术家
  ArtistRegex = 0b01 // 艺术家正则
}

enum TitleRegexMode {
  SpecTitle = 0b00, // 指定标题 (确保只有一首歌曲)
  TitleRegex = 0b10 // 标题正则 (多首歌曲，统一匹配)
}

enum RegexMode {
  OneArtistAndSpecTitle = ArtistRegexMode.OneArtist | TitleRegexMode.SpecTitle,
  OneArtistAndTitleRegex = ArtistRegexMode.OneArtist | TitleRegexMode.TitleRegex,
  ArtistRegexAndSpecTitle = ArtistRegexMode.ArtistRegex | TitleRegexMode.SpecTitle,
  ArtistRegexAndTitleRegex = ArtistRegexMode.ArtistRegex | TitleRegexMode.TitleRegex,
}


const RegexContext = createContext<{
  songsOriginal: Item[];
  setSongsFiltered: React.Dispatch<React.SetStateAction<Item[]>>
}>({
  songsOriginal: [],
  setSongsFiltered: () => { }
})

function RegexSheet() {
  // 默认统一艺术家和标题(要确保是不是单曲)
  const [artistMode, setArtistMode] = useState<ArtistRegexMode>(ArtistRegexMode.OneArtist)
  const [titleMode, setTitleMode] = useState<TitleRegexMode>(TitleRegexMode.SpecTitle)
  const { songsOriginal, setSongsFiltered } = useContext(RegexContext)
  const [title, setTitle] = useState<string>("")
  const [titleRegex, setTitleRegex] = useState<string>("")
  const [artist, setArtist] = useState<string>("")
  const [artistRegex, setArtistRegex] = useState<string>("")
  return <Sheet>
    <Button intent="outline">匹配规则</Button>
    <Sheet.Content>
      <Sheet.Header>
        <Sheet.Title>设置规则</Sheet.Title>
        <Sheet.Description>统一设置作者，然后使用正则表达式设置标题的匹配规则。推荐账号：<Link className="text-cyan-600" href="https://space.bilibili.com/3493093607213343">JLRS-LeoFM</Link></Sheet.Description>
      </Sheet.Header>

      <Sheet.Body className="space-y-4">
        {titleMode == TitleRegexMode.TitleRegex && <>
          <TextField label="标题<正则>" type="text" placeholder="输入匹配标题的正则表达式"
            value={titleRegex} onChange={setTitleRegex} />
          <div className="grid grid-cols-2 gap-2">
            <Button intent="secondary" onClick={() => setTitleRegex("《([^》]+)》")}>{"书名号规则"}</Button>
            <Button intent="secondary" onClick={() => setTitleRegex("")}>{"整个(留空)"}</Button>
          </div>
        </>}

        {titleMode == TitleRegexMode.SpecTitle && <TextField label="标题<名字>" type="text" placeholder="直接输入标题"
          value={title} onChange={setTitle} />}

        <Switch isSelected={titleMode == TitleRegexMode.SpecTitle}
          onChange={(isSelected: boolean) =>
            isSelected ? setTitleMode(TitleRegexMode.SpecTitle) : setTitleMode(TitleRegexMode.TitleRegex)
          }>直接设置单曲标题</Switch>

        {artistMode == ArtistRegexMode.ArtistRegex && <>
          <TextField label="歌手<正则>" type="text" placeholder="输入匹配歌手的正则表达式" value={artistRegex} onChange={setArtistRegex} />
        </>}

        {artistMode == ArtistRegexMode.OneArtist && <TextField label="歌手<名字>" type="text" placeholder="输入歌手的名字" value={artist} onChange={setArtist} />}

        <Switch isSelected={artistMode == ArtistRegexMode.OneArtist}
          onChange={(isSelected: boolean) => isSelected ? setArtistMode(ArtistRegexMode.OneArtist) : setArtistMode(ArtistRegexMode.ArtistRegex)}>使用统一歌手</Switch>
      </Sheet.Body>
      <Sheet.Footer>
        <Button intent="outline" type="submit"
          onClick={() => setSongsFiltered(songsOriginal)}
        >
          还原
        </Button>
        <Button intent="primary" type="submit"
          onClick={() => {
            switch (artistMode | titleMode) {
              case RegexMode.OneArtistAndSpecTitle:
                // 单曲
                if (title == "" || artist == "") {
                  toast.error("请输入标题或艺术家")
                  return
                }
                if (songsOriginal.length != 1) {
                  toast.error("确保只有一首歌曲")
                  return
                }
                setSongsFiltered(songsOriginal.map(song => ({
                  id: song.id,
                  label: title,
                  description: artist,
                })))
                break;

              case RegexMode.ArtistRegexAndSpecTitle:
                // 这种情况不存在
                toast.error("此模式无效")
                break;

              case RegexMode.OneArtistAndTitleRegex:
                // 注意这种模式titleRegex为空是有意义的
                if (artist == "") {
                  toast.error("请输入艺术家")
                  return
                }
                setSongsFiltered(songsOriginal.map(song => ({
                  id: song.id,
                  label: extract(titleRegex, song.label),
                  description: artist,
                })))
                break;

              case RegexMode.ArtistRegexAndTitleRegex:
                // 注意这种模式titleRegex和artistRegex为空都是有意义的
                setSongsFiltered(songsOriginal.map(song => {
                  const theTitle = extract(titleRegex, song.label)
                  const theArtist = extract(artistRegex, song.label)
                  return {
                    id: song.id,
                    label: theTitle,
                    description: theArtist,
                  }
                }))
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
  const BVidAndAid = useRef<(string | number)[]>([])
  const idTocid = useRef<Map<number, number>>(new Map())
  const [progressValue, setProgressValue] = useState<number>(0)

  useEffect(() => {
    setProgressValue(0)
    setSelectedKeys(new Set())
    setSongsFiltered(songsOriginal)
  }, [songsOriginal])

  const SearchBarInput = () => <TextField
    className={"flex-1"}
    name="name"
    type="text"
    placeholder="https://www.bilibili.com/video/BV1YmFPe4EnY"
    value={searchbar}
    onChange={(value: string) => setSearchbar(value)}
  />
  const SearchButton = () => <Button onClick={() => {
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
        BVidAndAid.current = [data.meta.bvid as string, data.meta.aid as number]
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
      })
  }}>查找</Button>

  useEffect(() => {
    if (allSelected)
      setSelectedKeys(new Set(songsFiltered.map((song) => song.id)))
    else
      setSelectedKeys(new Set([]))
  }, [allSelected])

  return (
    <div className="flex min-h-screen flex-row items-center justify-center md:px-0">
      <div className="space-y-3 w-full md:max-w-[500px] px-3 md:mx-auto">
        <div className="flex flex-row-reverse gap-2">
          <SearchButton />
          <SearchBarInput />
        </div>
        <Toolbar aria-label="Toolbars">
          <Toolbar.Group aria-label="download selections">
            <Toolbar.Item aria-label="select all" size="square-petite" intent="outline" onChange={(isSelected: boolean) => setAllSelected(isSelected)}>
              <IconChecklist />
            </Toolbar.Item>
            <Toolbar.Separator />
            <Button intent="outline"
              onClick={async () => {
                if (!(selectedKeys instanceof Set))
                  return
                if (selectedKeys.size == 0) {
                  toast.error("选择要下载的歌曲")
                  return
                }
                if (!BVidAndAid.current) {
                  toast.error("找不到bvid和aid呢")
                  return
                }
                const keysSize = selectedKeys.size
                setProgressValue(0)
                await new Promise(resolve => setTimeout(resolve, 1000))
                for (const id of selectedKeys) {
                  const index = parseInt(id.toString()) - 1
                  const { description: artist, label: title } = songsFiltered[index]
                  const bvid = BVidAndAid.current[0] as string
                  const aid = BVidAndAid.current[1] as number
                  const cid = idTocid.current.get(index + 1) as number
                  await fetch(new URL("https://api.xiaoyin.link/download"), {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                      title, artist, bvid, cid, aid
                    })
                  }).then(async (res) => {
                    if (res.status == 200)
                      return
                    // 下载失败，不论什么原因
                    const errorInfo = (await res.json()).error
                    throw new Error(errorInfo)
                  }).then(() => {
                    setProgressValue((index + 1) / keysSize * 100)
                  }).catch((e) => {
                    toast.error(`第${index}个失败，因为` + e)
                  })
                  await new Promise(resolve => setTimeout(resolve, 100))
                }
                setAllSelected(false)
              }}
            >下载选中项</Button>
            <RegexContext.Provider value={{ songsOriginal, setSongsFiltered }}>
              <RegexSheet />
            </RegexContext.Provider>
          </Toolbar.Group>

        </Toolbar>
        <ProgressBar label="下载进度" value={progressValue} />
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
          {(item) => <Choicebox.Item className="max-h-[100px]" {...item} />}
        </Choicebox>

      </div>
    </div >
  );
} 
