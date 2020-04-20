import matter from "gray-matter"
import algoliasearch from "algoliasearch/lite"
import { array, shape, string } from "prop-types"
import { useRouter } from "next/router"

import Head from "@components/head"
import Layout from "@components/layout"
import PostNavigation from "@components/post-navigation"
import PostFeedback from "@components/post-feedback"
import SideNav from "@components/side-nav"
import DocWrapper from "@components/doc-wrapper"
import MarkdownWrapper from "@components/markdown-wrapper"
import Toc from "@components/Toc"

import { parseNestedDocsMds, flatDocs, createToc } from "@utils"
import { useFormEditDoc, useCreateChildPage } from "@hooks"

import { useCMS } from "tinacms"
import { InlineForm, InlineTextField, InlineWysiwyg } from "react-tinacms-inline"
import InlineEditingControls from "@components/inline-controls"

const DocTemplate = ({ markdownFile, allNestedDocs, Alltocs }) => {
  const router = useRouter()
  const cms = useCMS()

  useCreateChildPage(allNestedDocs)
  const [data, form] = useFormEditDoc(markdownFile)

  if (!form) return null
  return (
    <Layout showDocsSearcher splitView>
      <Head title={data.frontmatter.title} />
      <InlineForm form={form}>
        <SideNav
          allNestedDocs={allNestedDocs}
          currentSlug={router.query.slug}
          groupIn={data.frontmatter.groupIn}
        />
        <DocWrapper>
          {process.env.NODE_ENV !== "production" && <InlineEditingControls />}
          <main>
            <h1>
              <InlineTextField name="frontmatter.title" />
            </h1>
            {Alltocs.length > 0 && <Toc tocItems={Alltocs} />}
            <InlineWysiwyg
              imageProps={{
                async upload(files) {
                  const directory = "/public/images/"

                  let media = await cms.media.store.persist(
                    files.map((file) => {
                      return {
                        directory,
                        file,
                      }
                    })
                  )
                  return media.map((m) => `/images/${m.filename}`)
                },
                previewUrl: (str) => str,
              }}
              name="markdownBody"
            >
              <MarkdownWrapper source={data.markdownBody} />
            </InlineWysiwyg>
          </main>

          <PostNavigation allNestedDocs={allNestedDocs} />
          <PostFeedback />
        </DocWrapper>
      </InlineForm>
    </Layout>
  )
}

DocTemplate.getInitialProps = async function (ctx) {
  const { slug } = ctx.query
  const content = await import(`@docs/${slug.join("/")}.md`)
  const data = matter(content.default)
  const allNestedDocs = ((context) => parseNestedDocsMds(context))(
    //eslint-disable-next-line
    require.context("@docs", true, /\.md$/)
  )

  // Update data in algolia
  const searchClient = algoliasearch("ND3Q3FDRQR", "16cffa070a73fdfb1ec9d95f9bd8afe7")
  const index = searchClient.initIndex("docs_index")
  const allFlattedDocs = flatDocs(allNestedDocs)
  index.replaceAllObjects(allFlattedDocs, { autoGenerateObjectIDIfNotExist: true })

  // Create Toc
  const Alltocs = createToc(data.content)

  return {
    markdownFile: {
      fileRelativePath: `docs/${slug.join("/")}.md`,
      frontmatter: data.data,
      markdownBody: data.content,
    },
    allNestedDocs,
    Alltocs,
  }
}

DocTemplate.propTypes = {
  allNestedDocs: array,
  markdownFile: shape(),
  Alltocs: string,
}

export default DocTemplate
