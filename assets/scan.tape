# From the repository root, run pnpm build and then bash assets/render-demo.sh.
Output raw.gif
Set Shell bash
Set Width 1680
Set Height 970
Set FontFamily "Menlo"
Set FontSize 28
Set Padding 24
Set Framerate 18
Set TypingSpeed 38ms
Set Theme "GitHub Dark"
Hide
Type "source ../prompt.sh"
Enter
Sleep 500ms
Ctrl+l
Show
Type "# First, scan the cart for code issues."
Enter
Type "aislop scan"
Enter
Wait@20s /cart \$/
Hide
ScrollUp 26
Sleep 400ms
Show
Sleep 7s
Hide
ScrollDown 40
Ctrl+l
Sleep 150ms
Show
Type "# Apply the automatic fixes."
Enter
Type "aislop fix"
Enter
Wait@20s /cart \$/
Sleep 3s
Type "# Scan again to check the fixes."
Enter
Type "aislop scan"
Enter
Wait@20s /cart \$/
Sleep 4s
