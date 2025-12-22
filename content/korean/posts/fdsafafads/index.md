---
title: "fdsafafads"
date: "2025-12-22 10:04:37.829Z"
draft: false
slug: "fdsafafads"
---

ㅗㄹㅇ놀ㅇ놀온ㅗㄹㅇ노
Verification: Video Insertion & Responsive Layout
I have added the "Smart Video" insertion feature and unified the post layout with the blog layout for full responsiveness.

What to Verify
1. The "Video" Button
Open the Admin > Posts page.
Click Write Post or Edit.
Verify that a Video Camera Icon (fa-video-camera) serves as the "Insert Video" button in the editor toolbar.
2. Video Insertion Scenarios
Test the button with the following inputs:

Type	Input Example	Expected Output
YouTube URL	https://www.youtube.com/watch?v=dQw4w9WgXcQ	{{< youtube dQw4w9WgXcQ >}}
YouTube Short	https://youtu.be/dQw4w9WgXcQ	{{< youtube dQw4w9WgXcQ >}}
YouTube Embed	<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" ...></iframe>	{{< youtube dQw4w9WgXcQ >}}
Vimeo URL	https://vimeo.com/123456789	{{< vimeo 123456789 >}}
Vimeo Embed	<iframe src="https://player.vimeo.com/video/123456789" ...></iframe>	{{< vimeo 123456789 >}}
Generic Video	https://example.com/video.mp4	{{< video src="https://example.com/video.mp4" >}}
3. Responsive Layout
Verify the layout of the new posts (/ko/posts/...) compares correctly with the existing blog posts (/ko/blog/...):

Open a post on Desktop: Verify the image is on the left (sticky) and content on the right.
Open the same post on Mobile: Verify the image is on top and full width, followed by the title and content.
Compare with /ko/blog/post-4/ to ensure the margins and spacings are identical.
Verify that the Admin Mode link is displayed cleanly.
4. Rendering
Save the post and preview it.
Verify that both the video players and the overall layout function correctly.Verification: Video Insertion & Responsive Layout
I have added the "Smart Video" insertion feature and unified the post layout with the blog layout for full responsiveness.

What to Verify
1. The "Video" Button
Open the Admin > Posts page.
Click Write Post or Edit.
Verify that a Video Camera Icon (fa-video-camera) serves as the "Insert Video" button in the editor toolbar.
2. Video Insertion Scenarios
Test the button with the following inputs:

Type	Input Example	Expected Output
YouTube URL	https://www.youtube.com/watch?v=dQw4w9WgXcQ	{{< youtube dQw4w9WgXcQ >}}
YouTube Short	https://youtu.be/dQw4w9WgXcQ	{{< youtube dQw4w9WgXcQ >}}
YouTube Embed	<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" ...></iframe>	{{< youtube dQw4w9WgXcQ >}}
Vimeo URL	https://vimeo.com/123456789	{{< vimeo 123456789 >}}
Vimeo Embed	<iframe src="https://player.vimeo.com/video/123456789" ...></iframe>	{{< vimeo 123456789 >}}
Generic Video	https://example.com/video.mp4	{{< video src="https://example.com/video.mp4" >}}
3. Responsive Layout
Verify the layout of the new posts (/ko/posts/...) compares correctly with the existing blog posts (/ko/blog/...):

Open a post on Desktop: Verify the image is on the left (sticky) and content on the right.
Open the same post on Mobile: Verify the image is on top and full width, followed by the title and content.
Compare with /ko/blog/post-4/ to ensure the margins and spacings are identical.
Verify that the Admin Mode link is displayed cleanly.
4. Rendering
Save the post and preview it.
Verify that both the video players and the overall layout function correctly.
tgregsg
{{< video src="https://cdn.day1company.io/prod/uploads/202512/133628-1535/example-ai-yihyeon-3-0.mp4" >}}

{{< youtube RFFAR5tyQjw >}}
{{< vimeo 1083549816 >}}