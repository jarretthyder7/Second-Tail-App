# Notes and Observations

- building does not work locally, theres a bunch of linting errors as well
- use toast hook looks way too complex, shadcn has a toaster built in. look into Sonner
- types need to be seperated into their own files see: [app/org/[orgId]/admin/animals/[id]/page.tsx]
- app/org/[orgId]/admin/animals/[id]/page.tsx seems really complex, consider splitting it up
```react
 <div className="relative">
                <label className="block text-xs text-[#8B6F47] mb-1">Stage</label>
                <select
                  value={dog.stage || "intake"}
                  onChange={(e) => handleStageChange(e.target.value)}
                  disabled={isUpdatingStage}
                  className="px-4 py-2 pr-10 border border-[#E5DED4] rounded-full text-sm font-medium bg-white text-[#5A4A42] hover:bg-[#FDF8F3] transition disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%235A4A42' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 0.75rem center",
                  }}
                >
                  <option value="intake">Intake</option>
                  <option value="evaluation">Evaluation</option>
                  <option value="in_foster">In Foster Care</option>
                  <option value="available">Available for Adoption</option>
                  <option value="adoption_pending">Adoption Pending</option>
                  <option value="adopted">Adopted</option>
                  <option value="medical_hold">Medical Hold</option>
                  <option value="returned">Returned to Rescue</option>
                </select>
              </div>
```

- consider making this dynamic, some fosters might have different processes
- is there a notion of operating procedure flexibility across different orgs?
- consider moving this into shared code: 

```
const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch")
  return res.json()
}
```


- use tanStackQuery or write your own remote state management, too much boiler plate here:
```
useEffect(() => {
    const fetchFosters = async () => {
      try {
        setIsLoading(true)
        const res = await fetch(`/api/admin/fosters?orgId=${orgId}`)
        if (!res.ok) throw new Error("Failed to fetch")
        const data = await res.json()
        setFostersData(data)
      } catch (error) {
        console.error("[v0] Error fetching fosters:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (orgId) {
      fetchFosters()
      // Removed polling
    }
  }, [orgId])

  const mutateFosters = async () => {
    try {
      const res = await fetch(`/api/admin/fosters?orgId=${orgId}`)
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setFostersData(data)
    } catch (error) {
      console.error("[v0] Error refreshing fosters:", error)
    }
  }
```

- in my opinion, pages should not hold all of the code in one place but should be collections of components, it makes things easier to manage
- consider using a <Spinner/> or something else instead of 
```
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }
```
- imo all your page.tsx's should follow a similar shape or skeleton, it reduces boiler plate and allows you to centralize changes
- lots of implicit any errors
- cant build locally
- please put a type on 
```  
const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*, organization:organizations(*)")
    .eq("id", user.id)
    .single()
```

- i like the protected routes
- i think you are at the point where its so large an AI cant safely traverse the code base without breaking things
- what is the difference between admin/** and org/[orgId]/admin/** 
- components should live next to the page's they serve unless they are shared, then they live higher up in the heirarchy
- not sure what is "backend" code here is it under lib?
