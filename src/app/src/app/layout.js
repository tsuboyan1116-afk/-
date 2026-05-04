import “./globals.css”;

export const metadata = {
title: “タスク”,
description: “シンプルなTodoアプリ”,
manifest: “/manifest.json”,
appleWebApp: {
capable: true,
statusBarStyle: “black-translucent”,
title: “タスク”,
},
};

export const viewport = {
themeColor: “#0d0d0d”,
};

export default function RootLayout({ children }) {
return (
<html lang="ja">
<head>
<link rel="apple-touch-icon" href="/icon-192.png" />
</head>
<body>{children}</body>
</html>
);
}
