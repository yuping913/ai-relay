#!/bin/bash
# 团队成员 Git 身份设置脚本
# 使用方法: bash scripts/setup-git-identity.sh <成员名>
#
# Git 身份规则：
# - Author（作者）：显示在 GitHub commit 上
# - Pusher（推送者）：统一用 Boss 的 GitHub 账号
#
# GitHub 账号格式：agent-[name]
# 邮箱格式：agent-[name]@users.noreply.github.com

MEMBER=$1

case $MEMBER in
  "小赫"|"xiaohe")
    git config user.name "小赫"
    git config user.email "agent-xiaohe@users.noreply.github.com"
    ;;
  "饼哥"|"bingge")
    git config user.name "饼哥"
    git config user.email "agent-bingge@users.noreply.github.com"
    ;;
  "像素姐"|"pixiel")
    git config user.name "像素姐"
    git config user.email "agent-pixiel@users.noreply.github.com"
    ;;
  "码飞"|"mafei")
    git config user.name "码飞"
    git config user.email "agent-mafei@users.noreply.github.com"
    ;;
  *)
    echo "未知成员: $MEMBER"
    echo "可选: 小赫/xiaohe, 饼哥/bingge, 像素姐/pixiel, 码飞/mafei"
    exit 1
    ;;
esac

echo "✅ Git 身份已设置为:"
echo "   姓名: $(git config user.name)"
echo "   邮箱: $(git config user.email)"
