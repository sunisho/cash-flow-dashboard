import React, { useState } from 'react'
import axios from 'axios'


export default function UploadForm({ onAnalyzed }){
const [file, setFile] = useState(null)
const [threshold, setThreshold] = useState(0)
const [apiBase, setApiBase] = useState('http://127.0.0.1:8000')
const [loading, setLoading] = useState(false)
const [error, setError] = useState('')


const submit = async (e)=>{
e.preventDefault()
setError('')
if(!file){ setError('Please select a CSV file.'); return }
const form = new FormData()
form.append('file', file)
form.append('threshold', String(threshold))
setLoading(true)
try{
const res = await axios.post(`${apiBase}/api/analyze`, form, { headers: { 'Content-Type':'multipart/form-data' } })
const payload = res.data
payload.threshold = threshold
onAnalyzed(payload)
}catch(err){
console.error(err)
setError('Analysis failed. Check API server and CSV format.')
}finally{
setLoading(false)
}
}


return (
<form onSubmit={submit} className="grid" style={{gap:10}}>
<div>
<div className="muted" style={{marginBottom:6}}>Upload weekly CSV (Date, Cash Inflows, Cash Outflows, Balance)</div>
<input type="file" accept=".csv" onChange={(e)=> setFile(e.target.files?.[0]||null)} />
</div>
<div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
<div>
<div className="muted" style={{fontSize:12, marginBottom:6}}>Net change threshold</div>
<input type="number" value={threshold} onChange={(e)=> setThreshold(Number(e.target.value||0))} />
</div>
<div>
<div className="muted" style={{fontSize:12, marginBottom:6}}>API base URL</div>
<input type="text" value={apiBase} onChange={(e)=> setApiBase(e.target.value)} />
</div>
<div style={{display:'flex',alignItems:'end'}}>
<button type="submit" disabled={loading}>{loading? 'Processing…' : 'Analyze'}</button>
</div>
</div>
{error && <div className="bad badge">{error}</div>}
</form>
)
}