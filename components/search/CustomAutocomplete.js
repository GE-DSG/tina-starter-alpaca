import { useEffect, useRef } from "react"
import { shape, string, func, array, bool } from "prop-types"
import Link from "next/link"
import {
  connectAutoComplete,
  Highlight,
  connectStateResults,
  connectHighlight,
} from "react-instantsearch-dom"
import styled from "styled-components"

const Autocomplete = ({
  handleToggleSearchInput,
  showMobileSearch,
  hits,
  currentRefinement,
  refine,
  query,
}) => {
  const inputRef = useRef()
  /* Effects */
  useEffect(() => {
    if (showMobileSearch) {
      inputRef.current.focus()
    }
  }, [showMobileSearch])

  /* Methods */
  const handleBlur = () => {
    setTimeout(() => {
      handleToggleSearchInput()
    }, 50)
  }

  return (
    <SearchWrapper>
      <Search
        placeholder="Search our docs by topic…"
        type="search"
        value={currentRefinement}
        onChange={(event) => refine(event.currentTarget.value)}
        {...(showMobileSearch && { onBlur: handleBlur })}
        ref={inputRef}
      />
      <SearchIcon className="icon-search" />
      <HitsWrapper show={query.length > 0}>
        <Results>
          {hits.map((hit) => (
            <Hit key={hit.key} hit={hit} />
          ))}
        </Results>
      </HitsWrapper>
    </SearchWrapper>
  )
}

Autocomplete.propTypes = {
  hits: array,
  currentRefinement: string,
  refine: func,
  query: string,
  handleToggleSearchInput: func,
  showMobileSearch: bool,
}

const CustomHighlight = connectHighlight(({ highlight, attribute, hit }) => {
  const parsedHit = highlight({
    highlightProperty: "_highlightResult",
    attribute,
    hit,
  }).filter((_, index) => index < 3)

  return (
    <HighlightContent>
      {parsedHit[0] &&
        parsedHit[0].value.substring(parsedHit[0].value.length - 30, parsedHit[0].value.length)}
      <mark>{parsedHit[1] && parsedHit[1].value}</mark>
      {parsedHit[2] && parsedHit[2].value.substring(0, 30)}
    </HighlightContent>
  )
})

const Hit = ({ hit }) => (
  <Link href={`/docs/${hit.slug}`} passHref>
    <HitItem>
      <HighlightTitle hit={hit} attribute="title" />
      <div>
        <CustomHighlight attribute="content" hit={hit} />
      </div>
    </HitItem>
  </Link>
)

Hit.propTypes = {
  hit: shape(),
}

const Results = connectStateResults(({ searchState, searchResults, children }) =>
  searchResults && searchResults.nbHits !== 0 ? (
    children
  ) : (
    <EmptyResult>No results have been found for {searchState.query}.</EmptyResult>
  )
)

const CustomAutocomplete = connectAutoComplete(Autocomplete)
export default CustomAutocomplete

const SearchWrapper = styled.div`
  position: relative;
`
const SearchIcon = styled.i`
  position: absolute;
  z-index: 1;
  top: 50%;
  left: 26px;
  transform: translateY(-50%);
`
const HighlightTitle = styled(Highlight)`
  font-size: 20px;
  font-weight: 700;
  color: #4c4c4c;
  line-height: 36px;
  display: block;
`
const HighlightContent = styled.div`
  font-size: 16px;
  line-height: 25px;
  color: #707070;
  mark {
    background-color: transparent;
    color: ${({ theme }) => theme.colors.primary};
    font-weight: 700;
  }
`

const Search = styled.input`
  position: relative;
  height: 80px;
  width: 100%;
  font-size: 1rem;
  padding: 10px 20px;
  padding-left: 54px;
  font-family: Roboto;
  background-color: white;
  display: flex;
  align-items: center;
  border: none;
  outline: 0;

  &:hover,
  &:focus {
    text-decoration: none;
  }

  &:focus {
    & ~ i {
      color: ${({ theme }) => theme.colors.primary};
    }
  }

  @media all and (min-width: 1024px) {
    height: 44px;
    border-radius: 2px;
  }
`
const HitsWrapper = styled.div`
  position: absolute;
  display: block;
  width: 100%;
  background: #fff;
  border: 1px solid #cce3fe;
  box-shadow: 2px 4px 8px 0px rgba(60, 60, 60, 0.2);
  display: ${({ show }) => (show ? `block` : `none`)};
  @media all and (min-width: 1024px) {
    top: 45px;
  }
`
const HitItem = styled.a`
  display: block;
  padding: 15px;
  box-shadow: 0px 1px 0 0px #cce3fe;
  text-decoration: none;

  & .ais-Highlight-highlighted {
    color: ${({ theme }) => theme.colors.primary};
    font-weight: bold;
    font-style: normal;
  }
  &:hover {
    background-color: #eef6ff;
  }
`
const EmptyResult = styled.div`
  padding: 20px 15px;
`
