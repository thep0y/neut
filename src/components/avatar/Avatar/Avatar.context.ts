import {
  createContext,
  useContext,
  type Accessor,
  type Setter,
} from "solid-js";

interface AvatarContextValue {
  imageLoadFailed: Accessor<boolean>;
  setImageLoadFailed: Setter<boolean>;
  /**
   * 是否渲染了 AvatarImage。
   * AvatarFallback 需要靠它区分「图片加载失败」与「压根没有图片」——
   * 后者（如只给首字母的头像）也必须显示 fallback，否则是一个空白圆圈。
   */
  imagePresent: Accessor<boolean>;
  setImagePresent: Setter<boolean>;
}

export const AvatarContext = createContext<AvatarContextValue>();

export const useAvatarContext = () => {
  const ctx = useContext(AvatarContext);
  if (!ctx) {
    throw new Error("useAvatarContext 必须用在 <Avatar> 内部");
  }

  return ctx;
};
