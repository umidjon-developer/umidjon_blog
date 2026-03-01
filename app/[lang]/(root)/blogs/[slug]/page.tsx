// ./app/[lang]/(root)/blogs/[slug]/page.tsx

import { getReadingTime } from "@/lib/utils";
import { getDetailedBlog } from "@/service/blog.service";
import { format } from "date-fns";
import { ArrowUpRight, CalendarDays, Clock, Minus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";

import { getCommentsByPostId, UserIdAuthorId } from "@/actions/commit.actions";
import ParsedHTML from "./ParsedHTML";
import dynamic from "next/dynamic";
const ShareBtns = dynamic(
  () => import("../../_components/share-btns"),
  { ssr: false }
);
const FormComment = dynamic(
  () => import("@/components/comment/form-comment"),
  { ssr: false }
);

const GetCommentCard = dynamic(
  () => import("@/components/comment/get-comment-card"),
  { ssr: false }
);
type Author = {
  id: string;
  name: string;
  image: { url: string };
  bio?: string;
};

type Blog = {
  slug: string;
  title: string;
  description?: string;
  content: { html: string };
  image: { url: string };
  author: Author;
  tag?: { name?: string };
  createdAt: string | Date;
};

export async function generateMetadata({
  params,
}: {
  params: { slug: string; lang: string };
}) {
  const blog = (await getDetailedBlog(
    params.slug,
    params?.lang
  )) as Blog | null;

  return {
    title: blog?.title,
    description: blog?.description,
    keywords: blog?.tag?.name,
    openGraph: {
      images: blog?.image?.url,
    },
  };
}

async function SlugPage({
  params,
}: {
  params: { slug: string; lang: string };
}) {
  const blog = (await getDetailedBlog(
    params.slug,
    params?.lang
  )) as Blog | null;

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  // ✅ SAFE: faqat user bo‘lsa query qilamiz
  const isCommit = userId
    ? await UserIdAuthorId(userId, params.slug)
    : null;

  const getCommentCard = await getCommentsByPostId(params.slug);

  if (!blog) {
    return (
      <div className="max-w-5xl mx-auto pt-[15vh]">
        <h1 className="text-4xl font-creteRound">Blog not found</h1>
      </div>
    );
  }

  // ✅ OLDINDAN hisoblash (hydration safe)
  const readingTime = getReadingTime(blog.content.html);

  // ✅ Date format safe
  const formattedDate = format(
    new Date(blog.createdAt),
    "MMM dd, yyyy"
  );

  const comments = Array.isArray(getCommentCard)
    ? getCommentCard.map((comment) => ({
        _id: String(comment._id),
        content: String(comment.content),
        author: {
          name: comment.author.name,
          email: comment?.author?.email ?? "",
          image:
            (comment.author.image?.url ?? comment.author.image) || undefined,
        },
        createdAt:
          typeof comment.createdAt === "string"
            ? comment.createdAt
            : (comment.createdAt as Date).toISOString(),
      }))
    : [];

  return (
    <div className="pt-[15vh] max-w-5xl mx-auto">
      <h1 className="lg:text-6xl md:text-5xl text-4xl font-creteRound">
        {blog.title}
      </h1>

      <div className="flex items-center flex-wrap max-md:justify-center gap-4 mt-4">
        <div className="flex items-center gap-2">
          <Image
            src={blog.author.image.url}
            alt="author"
            width={30}
            height={30}
            className="object-cover rounded-sm"
          />
          <p>by {blog.author.name}</p>
        </div>

        <Minus />

        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          <p>{readingTime} min read</p>
        </div>

        <Minus />

        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5" />
          <p suppressHydrationWarning>{formattedDate}</p>
        </div>
      </div>

      <Image
        src={blog.image.url}
        alt="alt"
        width={1120}
        height={595}
        className="mt-4 rounded-md"
      />

      <div className="flex md:gap-12 max-md:flex-col-reverse mt-12 relative">
        <div className="flex flex-col space-y-3">
          <div className="sticky top-36">
            <p className="text-lg uppercase text-muted-foreground">Share</p>
            <ShareBtns />
          </div>
        </div>

        <div className="flex-1 prose dark:prose-invert">
          {/* ✅ HYDRATION SAFE */}
          <ParsedHTML html={blog.content.html} />
        </div>
      </div>

      <GetCommentCard comments={comments} />

      {!userId ? (
        <p className="text-center mt-10">
          Komment yozish uchun avval tizimga kiring
        </p>
      ) : isCommit?.comments?.length ? (
        <p className="text-center mt-10">
          Siz faqat bitta komment qoldirishingiz mumkin
        </p>
      ) : (
        <FormComment
          postId={blog.slug}
          authorId={userId}
          slug={blog.slug}
        />
      )}

      <div className="flex mt-6 gap-6 items-center max-md:flex-col">
        <Image
          src={blog.author.image.url}
          alt="author"
          width={155}
          height={155}
          className="rounded-md max-md:self-start"
        />

        <div className="flex-1 flex flex-col space-y-4">
          <h2 className="text-3xl font-creteRound">
            {blog.author.name}
          </h2>

          <p className="line-clamp-2 text-muted-foreground">
            {blog.author.bio}
          </p>

          <Link
            href={`/author/${blog.author.id}`}
            className="flex items-center gap-2 hover:text-blue-500 underline transition-colors"
          >
            <span>See all posts by this author</span>
            <ArrowUpRight />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default SlugPage;
