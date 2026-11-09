import { useState, type ComponentType } from "react";
import {
  Plane,
  Wifi,
  Bluetooth,
  Signal,
  Battery,
  Settings,
  Accessibility,
  Image,
  Bell,
  Volume2,
  Moon,
  Shield,
  ChevronRight,
  Search,
  Check,
  Link,
  Globe,
  Mic,
} from "lucide-react";
import type { Work, Item } from "../schema";
import { IOSToggle } from "../vendor/konsta/Toggle";
import { NavigationPage, useNavigation } from "./Navigation";
type Row = [ComponentType<{ size?: number }>, string, string];
const settingsLabels: Record<string, string> = {
  "飞行模式": "機内モード",
  "无线局域网": "Wi-Fi",
  "蓝牙": "Bluetooth",
  "蜂窝网络": "モバイル通信",
  "个人热点": "インターネット共有",
  "电池": "バッテリー",
  "通用": "一般",
  "辅助功能": "アクセシビリティ",
  "墙纸": "壁紙",
  "通知": "通知",
  "声音与触感": "サウンドと触覚",
  "专注模式": "集中モード",
  "面容 ID 与密码": "Face IDとパスコード",
  "关于本机": "情報",
  "软件更新": "ソフトウェアアップデート",
  "iPhone 储存空间": "iPhoneストレージ",
  "日期与时间": "日付と時刻",
  "语言与地区": "言語と地域",
  "名称": "名前",
  "iOS 版本": "iOSバージョン",
  "机型名称": "機種名",
  "照片": "写真",
  "应用程序": "アプリ",
  "低电量模式": "低電力モード",
  "电池电量": "バッテリー残量",
  "日期": "日付",
  "时间": "時刻",
  "时区": "時間帯",
  "已设置密码": "パスコード設定済み",
  "未设置密码": "パスコード未設定",
  "设置": "設定",
  "未连接": "未接続",
  "关闭": "オフ",
  "打开": "オン"
};
const settingLabel = (value = "") => settingsLabels[value] || value;
const groups: Row[][] = [
  [
    [Plane, "飞行模式", "#ff9500"],
    [Wifi, "无线局域网", "#007aff"],
    [Bluetooth, "蓝牙", "#007aff"],
    [Signal, "蜂窝网络", "#34c759"],
    [Link, "个人热点", "#65ce88"],
    [Battery, "电池", "#34c759"],
    [Globe, "VPN", "#007aff"],
  ],
  [
    [Settings, "通用", "#8e8e93"],
    [Accessibility, "辅助功能", "#007aff"],
    [Image, "墙纸", "#32ade6"],
  ],
  [
    [Bell, "通知", "#ff3b30"],
    [Volume2, "声音与触感", "#ff2d55"],
    [Moon, "专注模式", "#5856d6"],
    [Shield, "面容 ID 与密码", "#34c759"],
  ],
];
export function NativeSettings({
  work,
  items,
  creator,
  onItem,
  onSettings,
}: {
  work: Work;
  items: Item[];
  creator: boolean;
  onItem: (i: Item) => void;
  onSettings?: () => void;
}) {
  const nav = useNavigation(),
    [query, setQuery] = useState(""),
    [airplane, setAirplane] = useState(false),
    [wifi, setWifi] = useState(true),
    [bluetooth, setBluetooth] = useState(true),
    [lowPower, setLowPower] = useState(false);
  const row = (label: string, value?: string, click?: () => void) => (
    <button key={label} className="settings-native-row" onClick={click}>
      <span>{settingLabel(label)}</span>
      <span className="settings-detail-value">{settingLabel(value)}</span>
      {click && <ChevronRight size={16} />}
    </button>
  );
  const toggle = (label: string, value: boolean, set: (v: boolean) => void) => (
    <div className="settings-native-row">
      <span>{settingLabel(label)}</span>
      <IOSToggle label={settingLabel(label)} checked={value} onChange={set} />
    </div>
  );
  const sub = () => {
    switch (nav.page) {
      case "通用":
        return (
          <div className="settings-group">
            {row("关于本机", "", () => nav.push("关于本机"))}
            {row("软件更新", "iOS 18.0", () => nav.push("软件更新"))}
            {row("iPhone 储存空间", "", () => nav.push("iPhone 储存空间"))}
            {row("日期与时间", "", () => nav.push("日期与时间"))}
            {row("语言与地区", "日本語", () => nav.push("语言与地区"))}
          </div>
        );
      case "语言与地区":
        return (
          <div className="settings-group">
            {row("iPhoneの使用言語", "日本語")}
            {row("地域", "日本")}
            {row("優先する言語", "日本語・한국어・English")}
          </div>
        );
      case "关于本机":
        return (
          <div className="settings-group">
            {row("名称", work.phone.owner + "のiPhone")}
            {row("iOS 版本", "18.0")}
            {row("机型名称", "iPhone 15 Pro")}
            {row("照片", String(work.data.photos?.length || 0))}
            {row(
              "应用程序",
              String(work.apps.filter((a) => a.installed).length),
            )}
          </div>
        );
      case "Wi-Fi":
      case "无线局域网":
        return (
          <>
            <div className="settings-group">
              {toggle("Wi-Fi", wifi, setWifi)}
            </div>
            {wifi && (
              <>
                <p className="settings-section-label">マイネットワーク</p>
                <div className="settings-group">
                  <div className="settings-native-row">
                    <Check size={18} color="#007aff" />
                    <span>{work.phone.network}</span>
                    <Wifi size={18} />
                  </div>
                </div>
                <p className="settings-page-caption">
                  接続状態は、この作品内の仮想スマートフォンにのみ適用されます。
                </p>
              </>
            )}
          </>
        );
      case "蓝牙":
        return (
          <>
            <div className="settings-group">
              {toggle("蓝牙", bluetooth, setBluetooth)}
            </div>
            <p className="settings-page-caption">
              {bluetooth ? "自分のデバイス" : "Bluetoothはオフです"}
            </p>
          </>
        );
      case "电池":
        return (
          <>
            <div className="settings-group">
              {row("电池电量", work.phone.battery + "%")}
              {toggle("低电量模式", lowPower, setLowPower)}
            </div>
            <p className="settings-page-caption">
              低電力モードは、仮想デバイスの状態のみを変更します。
            </p>
          </>
        );
      case "日期与时间":
        return (
          <div className="settings-group">
            {row("日期", work.phone.date || "2026-09-01")}
            {row("时间", work.phone.time)}
            {row("时区", "ソウル（UTC+9）")}
          </div>
        );
      case "iPhone 储存空间":
        return (
          <div className="settings-group">
            {work.apps
              .filter((a) => a.installed)
              .map((a) => row(a.name, `${work.data[a.id]?.length || 0}件`))}
          </div>
        );
      case "软件更新":
        return (
          <p className="settings-page-caption">
            iOS 18.0 · 作品内の仮想システムです。システム更新はダウンロードされません。
          </p>
        );
      default:
        return (
          <>
            <div className="settings-group">
              {row(
                nav.page,
                nav.page === "面容 ID 与密码"
                  ? work.phone.passcode
                    ? "已设置密码"
                    : "未设置密码"
                  : "",
              )}
            </div>
            {!items.some((i) => i.folder === nav.page) && (
              <p className="settings-page-caption">この作品では、ほかの設定項目は用意されていません。</p>
            )}
          </>
        );
    }
  };
  return (
    <div className="native-settings" data-root={!nav.page}>
      <NavigationPage
        page={settingLabel(nav.page)}
        back={nav.pop}
        title={nav.depth > 1 ? "一般" : "設定"}
      >
        {nav.page ? (
          sub()
        ) : (
          <>
            <h1>設定</h1>
            {!query && (
              <button
                className="settings-account"
                onClick={() => nav.push(work.phone.owner)}
              >
                <span>{work.phone.owner.slice(0, 1)}</span>
                <div>
                  <strong>{work.phone.owner}</strong>
                  <small>Apple Account、iCloudなど</small>
                </div>
                <ChevronRight size={17} />
              </button>
            )}
            {groups.map((group, n) => (
              <div className="settings-group" key={n}>
                {group
                  .filter(([, name]) => settingLabel(name).toLowerCase().includes(query.toLowerCase()) || name.includes(query))
                  .map(([Icon, name, color]) => (
                    <div
                      key={name}
                      className="settings-native-row"
                      role={name === "飞行模式" ? undefined : "button"}
                      tabIndex={name === "飞行模式" ? undefined : 0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") nav.push(name);
                      }}
                      onClick={() => {
                        if (name !== "飞行模式") nav.push(name);
                      }}
                    >
                      <span
                        className="settings-glyph"
                        style={{ background: color }}
                      >
                        <Icon size={21} />
                      </span>
                      <span>{settingLabel(name)}</span>
                      {name === "飞行模式" ? (
                        <IOSToggle
                          label="機内モード"
                          checked={airplane}
                          onChange={setAirplane}
                        />
                      ) : (
                        <>
                          <small>
                            {name === "无线局域网"
                              ? wifi
                                ? "未接続"
                                : "オフ"
                              : name === "蓝牙"
                                ? bluetooth
                                  ? "オン"
                                  : "オフ"
                                : name === "VPN"
                                  ? "未接続"
                                  : name === "蜂窝网络" || name === "个人热点"
                                    ? "オフ"
                                    : ""}
                          </small>
                          <ChevronRight size={16} />
                        </>
                      )}
                    </div>
                  ))}
              </div>
            ))}
          </>
        )}
        {items
          .filter(
            (i) =>
              !nav.page || i.folder === nav.page || i.title.includes(nav.page),
          )
          .map((i) => (
            <button className="record-row" key={i.id} onClick={() => onItem(i)}>
              {i.title}
              <ChevronRight size={16} />
            </button>
          ))}
        {creator && (
          <button className="phone-add" onClick={onSettings}>
            システム設定を編集
          </button>
        )}
      </NavigationPage>
      {!nav.page && (
        <label className="settings-search">
          <Search size={23} />
          <input
            aria-label="設定を検索"
            placeholder="検索"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Mic size={22} aria-hidden="true" />
        </label>
      )}
    </div>
  );
}
