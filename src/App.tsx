import { useState } from 'react'
import axios from "axios"
import './App.css'
import Scheduler from './components/Scheduler'
import { PRIMARY_COLOR, SECONDARY_COLOR, ACCENT_COLOR, CELL_ACCENT_COLOR, CELL_PRIMARY_COLOR, CELL_SECONDATY_COLOR, HTTP_URL, TEACHER_REQ, COURSE_REQ } from './Settings'
import { Course, Subject, Teacher } from './Interfaces'

type HourData = {
  day      : number
  fromHour : number
  toHour   : number
  teachers : Teacher[]
  subject  : Subject
}

type RealCourseResponse = {
  TeachingID     : number
  Day            : number
  Hour           : number
  TeacherID      : number
  SubjectName    : string
  CourseYear     : number
  CourseSection  : string
  IsAbsence      : boolean
  IsSubstitution : boolean
  Teacher        : { Name : string, Surname : string }
}

type RealTeacherResponse = { 
  TeachingID     : number
  Day            : number
  Hour           : number
  TeacherID      : number
  SubjectName    : string
  CourseYear     : number
  CourseSection  : string
  IsAbsence      : boolean
  IsSubstitution : boolean 
}
function App() {
  const data:Course = {IsSubsidiary : true, Section : "AT", Year : 1}

  return (
    <Scheduler 
      height = {"100%"}
      width  = {"100%"}
      data   = {data}
      hourTabWidth    = {'15%'}
      dayTabHeight    = {'10%'}
      accent_color    = {ACCENT_COLOR}
      primary_color   = {PRIMARY_COLOR}
      secondary_color = {SECONDARY_COLOR}
      cellProps = {{
        text_color           : CELL_ACCENT_COLOR,
        pres_primary_color   : CELL_PRIMARY_COLOR,
        pres_secondary_color : CELL_SECONDATY_COLOR,
        abs_primary_color    : "",
        abs_secondary_color  : "",
        sub_primary_color    : "",
        sub_secondary_color  :"",
        border_size          : 2
      }}
      timeSettings = {{
        hourLenght : '1:00',
        fromHour   : "8:00",
        toHour     : "17:00"
      }} 
      hourIndentationWidth = {'10px'}/>
  )
}

export default App
