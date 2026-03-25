'use client';
 
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import React, { useState, useEffect } from "react";

const Search =  ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const placeholder = "Search.."
  const pathname = usePathname();
  const { replace } = useRouter();
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams);

  useEffect(() => {   
    // console.log("searchTermset_params3gggggg",searchTerm)
    params.set('page', '1');
    if (searchTerm) {
      params.set('q', searchTerm);
    } else {
      params.delete('q');
    }    
    replace(`${pathname}?${params.toString()}`); 
       
    const delayDebounceFn = setTimeout(() => {         
      onSearch()
    }, 800,[])

    return () => clearTimeout(delayDebounceFn)


  }, [searchTerm])

  return (
    <div className="sdl-search-wrapper ">
    <i className="w-icon-search sdl-search-icn"></i>
    <input
      autoFocus
      type='text'
      autoComplete='off'
      className="address form-control rounded-0 placeholder:text-gray-500 rounded-pill"
      placeholder='Search'
      onChange={(e) => setSearchTerm((e.target as HTMLInputElement).value
      )}
      onKeyUp={(e) => setSearchTerm((e.target as HTMLInputElement).value
      )}
      defaultValue={searchParams.get('q')?.toString()}
    />
    </div>
  )
}

const Search1 = ({ onSearch }) => {
  const placeholder = "Search.."
  const pathname = usePathname();
  const { replace } = useRouter();
  const searchParams = useSearchParams();

  function handleSearch(term: string) {
       
    console.log(`Searching... ${term}`);
  
    const params = new URLSearchParams(searchParams);
    params.set('page', '1');
    if (term) {
      params.set('q', term);
    } else {
      params.delete('q');
    }
    setTimeout(() => {
      onSearch()  
    }, 1000);
    replace(`${pathname}?${params.toString()}`);
  }

  return (
   
    <div className="sdl-search-wrapper ">
    <i className="w-icon-search sdl-search-icn"></i>
    <input
      className="address form-control rounded-0 placeholder:text-gray-500 rounded-pill"
      placeholder={placeholder}
      onChange={(e) => {
          handleSearch(e.target.value);
      }}
      // onKeyDown={(e) => {
      //   handleSearch(e.target.value);
      // }}
      onKeyUp={(e) => {
        handleSearch((e.target as HTMLInputElement).value);
      }}
      // onKeyPress={(e) => {
      //   handleSearch(e.target.value);
      // }}
      // onKeyPressCapture={(e) => {
      //   handleSearch(e.target.value);
      // }}
      // onKeyUpCapture={(e) => {
      //   handleSearch(e.target.value);
      // }}
      defaultValue={searchParams.get('q')?.toString()}
      />
  </div>
  );
};
export default Search;
