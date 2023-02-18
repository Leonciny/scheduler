import { useEffect, useState } from "react"
import Style from "./Scheduler.module.css"
import { Course, Subject, Teacher } from "../Interfaces"
import axios from "axios"
import { COURSE_REQ, HTTP_URL, TEACHER_REQ } from "../Settings"

type HEXColorString  = string
type RGBColorString  = string | [ number, number, number ]
type RGBAColorString = string | [ number, number, number, number ]

type TeacherData = {
	Id             : number
	Name           : string 
	Surname        : string 
	isAbsent       : boolean 
	classYear      : number 
	TeachingId     : number 
	classSection   : string
	isSubstitution : boolean
}

type HourData = {
	day      : number
	fromHour : number
	teachers : Array<TeacherData>
	subject  : string
}

type TimeSettings = {
	hourLenght : string
	fromHour   : string
	toHour     : string
}

type CellProps = {
	text_color           : RGBColorString | RGBAColorString | HEXColorString
	
	pres_primary_color   : RGBColorString | RGBAColorString | HEXColorString
	pres_secondary_color : RGBColorString | RGBAColorString | HEXColorString

	abs_primary_color    : RGBColorString | RGBAColorString | HEXColorString
	abs_secondary_color  : RGBColorString | RGBAColorString | HEXColorString

	sub_primary_color    : RGBColorString | RGBAColorString | HEXColorString
	sub_secondary_color  : RGBColorString | RGBAColorString | HEXColorString

	border_size          : number | string
}

type Props = {
	data    : Teacher | Course
	width   ?: number | string
	height  ?: number | string

	dayTabHeight          : number | string
	hourTabWidth          : number | string
	hourIndentationWidth  : number | string

	accent_color    : RGBColorString | RGBAColorString | HEXColorString
	primary_color   : RGBColorString | RGBAColorString | HEXColorString
	secondary_color : RGBColorString | RGBAColorString | HEXColorString
	
	cellProps    : CellProps

	timeSettings : TimeSettings
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


const EVER                    = true,
	  HOUR_FORMATTER          = Intl.NumberFormat(undefined, {minimumIntegerDigits : 2}),
	  SPAN_BORDER_SIZE        = 2,
	  CELL_BORDER_SIZE        = 1,
	  FALLBACK_UNIT_TYPE      = "px",
	  POP_UP_WIDTH_MULTIPLYER = 1.2

const TODAY         = new Date(),
	  CURRENT_WEEK  = new Date(),
	  MONDAY_OFFSET = 1,
	  DAYS          = [
		  "Lunedì",
		  "Martedì",
		  "Mercoledì",
		  "Giovedì",
		  "Venerdì"
	  ]

const ABSENCE_ADD_HTTP_REQ= "https://gestione-orari.up.railway.app/",
	  ABSENCE_ADD_ACTION = "absence-add",
	  ABSENCE_REMOVE_HTTP_REQ = "https://gestione-orari.up.railway.app/",
	  ABSENCE_REMOVE_ACTION = "absence-remove-no-id"

CURRENT_WEEK.setHours(0)
CURRENT_WEEK.setMilliseconds(0)
CURRENT_WEEK.setSeconds(0)
CURRENT_WEEK.setMinutes(0)
CURRENT_WEEK.setDate( CURRENT_WEEK.getDate() - CURRENT_WEEK.getDay() )

/*********************
 * !                 *
 * * HELPER FUNCTION *
 * ?                 *
 *********************/

const extractColor : ( color : RGBColorString | RGBAColorString | HEXColorString ) => string = color => 
	( typeof color === "string" ) 
		? color 
		: color.length === 3 
			? `rgb(${color.join(", ")})` 
			: `rgba(${color.join(", ")})`

const extractMaybeSize : ( prop : undefined | number | string ) => string = prop =>
	( prop === undefined ) 
		? "100%"
		: extractSize(prop)

const extractSize : ( prop : number | string ) => string = prop =>
	( typeof prop === "string" )
		? prop
		: `${prop}${FALLBACK_UNIT_TYPE}`

const getIntegerFromTime = ( time : string ) => 
	time.split(":")
		.reduce((acc, val, index) => acc + Number(val) * ( 60 ** ( 1 - index ) ), 0)
		
const getTimeFromInteger = ( integer : number ) =>
	`${ ~~( integer / 60 ) }:${ HOUR_FORMATTER.format( integer % 60 ) }`

const sendDataRequest = ( reqObj : Teacher | Course, week : Date ) : Promise<HourData[]> => new Promise( (res, rej) => {
	let dataArray = new Array<HourData>();
	(reqObj as Teacher).Surname === null 
		? axios.post<RealTeacherResponse[]>( HTTP_URL, { 
			
			name : TEACHER_REQ,
			argv : [(reqObj as Teacher).TeacherID, week.toISOString().split('T')[0]]
		
		} ).then( ( { data } : { data : RealTeacherResponse[] } ) => {
			console.log(data)
			data.forEach( el => {
				dataArray.push({
					day      : el.Day,
					subject  : el.SubjectName,
					fromHour : el.Hour,
					teachers : new Array({
						Id             : el.TeacherID,
						Name           : (reqObj as Teacher).Name,
						Surname        : (reqObj as Teacher).Surname,
						isAbsent       : el.IsAbsence,
						classYear      : el.CourseYear, 
						TeachingId     : el.TeachingID,
						classSection   : el.CourseSection,
						isSubstitution : el.IsSubstitution,
					})
				})
			})
			res(dataArray)
		} )
		: axios.post<RealCourseResponse[]>( HTTP_URL, {
			
			name : COURSE_REQ,
			argv : [(reqObj as Course).Year, (reqObj as Course).Section, week.toISOString().split('T')[0]] 

		} ).then( ( { data } : { data : RealCourseResponse[] } ) => {
			console.log(data)
			data.forEach( el => {
				let found = dataArray.find( hour => hour.day === el.Day && hour.fromHour === el.Hour ) 
				found ? found.teachers.push( { 
					Id             : el.TeacherID,
					Name           : el.Teacher.Name,
					Surname        : el.Teacher.Surname,
					isAbsent       : el.IsAbsence,
					classYear      : el.CourseYear, 
					TeachingId     : el.TeachingID,
					classSection   : el.CourseSection,
					isSubstitution : el.IsSubstitution,
				} ) : dataArray.push( {
					day      : el.Day,
					subject  : el.SubjectName,
					fromHour : el.Hour,
					teachers : new Array({
						Id             : el.TeacherID,
						Name           : el.Teacher.Name,
						Surname        : el.Teacher.Surname,
						isAbsent       : el.IsAbsence,
						classYear      : el.CourseYear, 
						TeachingId     : el.TeachingID,
						classSection   : el.CourseSection,
						isSubstitution : el.IsSubstitution,
					})
				} )
			})
			res(dataArray)
		} )
	
})

const setTeacherStatus = (id : number, status : "absent" | "present", week : Date) => {
	axios.post( status === "absent" ? ABSENCE_ADD_HTTP_REQ : ABSENCE_REMOVE_HTTP_REQ, {
		name : status === "absent" ? ABSENCE_ADD_ACTION : ABSENCE_REMOVE_ACTION,
		argv : [week.toISOString().split("T")[0], id]
	})
}

/**
 * ?  1 : ALMENO UN PROF PRESENTE
 * ?  2 : ALMENO UNA SOSTITUZIONE IN ATTO
 * ?  0 : TUTTI I PROF ASSENTI
 */
const generateAbsenceHourStatus = (teachers : TeacherData[]) => {
	if(teachers === undefined) return 1
	let reduction = teachers.reduce( (acc, cur) => 
		cur.isAbsent 
			? ( acc + 1 ) 
			: cur.isSubstitution 
				? ( acc + teachers.length + 1 ) 
				: acc, 0);

	return (reduction == teachers.length 
		? 0
		: reduction > teachers.length 
			? 2
			: 1 )
}
/***********************
 * !                   *
 * * DAY SELECTION BAR *
 * ?                   *
 ***********************/

const DayView = ({ currentWeek, height, width, accent_color, accent_text_color } : { currentWeek : Date, height : string, width : string, accent_color : string, accent_text_color : string  } ) => {
	
	let temp_data = new Date(currentWeek)
	temp_data.setDate(temp_data.getDate() + 1)

	const getDataAndIncrement = () => {
		let ret = temp_data.getDate();
		temp_data.setDate(temp_data.getDate() + 1)
		return ret
	}

	const getSpan = ( day : number, month : number ) => {
		const IS_TODAY =  TODAY.getDate()  === day 
					   && TODAY.getMonth() === month
		
		return (
			<span style={ 
				IS_TODAY ? {
					backgroundColor : accent_color,
					color           : accent_text_color,
					border          : `${SPAN_BORDER_SIZE}px solid ${accent_color}`
				} : {
					border          : `${SPAN_BORDER_SIZE}px solid ${accent_color}`
				} 
			}>
				{day}/{month + 1}
			</span>
		)
	}

	return (
	<div className={Style.schedulerDayContainer} style={{width}}>
		{DAYS.map( el => (
			<div className={Style.schedulerDay} key={el}>
				<div>
					{getSpan(getDataAndIncrement(),temp_data.getMonth())}
				</div>
				<div>
					<p>{el}</p>
				</div>
			</div>
		))}
	</div>
)}



const HourIndentation = ( { color, numberOfModules, width, size } : { color : string, numberOfModules : number, width : string, size : string } ) => {
	return(
		<div 
			className={Style.indentationWrap}
			style={{
				width,
				height: `100%`,
			}}
		>
			{new Array(numberOfModules).fill(0).map( (el, index) => (
				<div key={`H_INDENT_${index}`}
					className={Style.indentationBox}
					style={{
						height    : `100%`,
						borderTop : `${size} solid ${color}`,
						transform : `translate(0, calc(${size}) * -1.5)`
					}}	
				/>
			))}
			<div style={{minHeight : size}}/>
		</div>
	)
}

/***********************
 * !                   *
 * * LEFT HOUR DISPLAY *
 * ?                   *
 ***********************/

const HourDisplay = ({ timeSettings, hourTabWidth, numberOfModules, cellBorderSize } : { timeSettings : TimeSettings, hourTabWidth : number | string, numberOfModules : number, cellBorderSize : string }) => {

	function* moduleGenerator() {
		const IncrementValue = getIntegerFromTime(timeSettings.hourLenght),
			  StartValue     = getIntegerFromTime(timeSettings.fromHour)
		let i = 0
		for(;EVER;) yield getTimeFromInteger( StartValue + (IncrementValue * ++i) )
	}

	let getHour = moduleGenerator()
	let modules = new Array<string>()
	for(let i = 0; i < numberOfModules - 1; i++) modules.push(getHour.next().value as string)
	return (
		<div className={Style.hourDisplayContainer} style={{ width : hourTabWidth }}>
			{modules.map( mod => ( 
			<div key={mod} className={Style.hourDisplay}>
				<p className={Style.hourLabel}
					style={{ transform : `translate(-4px, calc( calc(${cellBorderSize} / 2) + var(--hour-display-font-size)/2))`}}
				>{mod}</p>
			</div>
			))}
			<div className={Style.hourDisplay}></div>
		</div>
	)
}

/*******************
 * !               *
 * * ITEM RENDERER *
 * ?               *
 *******************/
const GetItemForCell = ( { 
	index, 
	COLORS, 
	data, 
	totalHeight, 
	dayTabHeight, 
	popUpCol, 
	borderColor, 
	numberOfModules, 
	width, 
	TEXT_COLOR,
	colorIndex,
	colorIndexSet,
	currentDate
} : {
	index : number, 
	COLORS : string[], 
	data : HourData, 
	totalHeight : string, 
	dayTabHeight : string, 
	popUpCol : string, 
	borderColor : string,
	numberOfModules : number,
	width : string,
	TEXT_COLOR : string,
	colorIndex : number,
	colorIndexSet : React.Dispatch<React.SetStateAction<number>>,
	currentDate : Date
}) => {

	const [ showPopUp, setShowPopUp ] = useState(false),
		  DAY  = index % DAYS.length,
		  HOUR = ~~ ( index / DAYS.length )
	
	if ( data === undefined ) return ( <div className={Style.HourGridCellData} /> )
	else {
		return (
		<div className={Style.HourGridCellDataWrap}>
			<div 
				className={Style.HourGridCellData} 
				style={{
					backgroundColor : COLORS[colorIndex],
					color           : TEXT_COLOR,
				}} 
				onMouseOver = { ev => ev.currentTarget.style.backgroundColor = COLORS[colorIndex + 3] }
				onMouseOut  = { ev => ev.currentTarget.style.backgroundColor = COLORS[colorIndex] }
				onClick     = { ev => {
					if( active !== null) active(false)
					active = setShowPopUp
					setShowPopUp(true) 
				} }
			>
				<p>{ data.subject }</p>
			</div>
			<div 
				className={Style.popUpWrapper}
				style={{
					display : showPopUp ? "grid" : "none", 
					backgroundColor : popUpCol,
					width   : `calc(${width} / ${DAYS.length} * ${POP_UP_WIDTH_MULTIPLYER} )`,
					minHeight	: `calc( calc(${totalHeight} - ${dayTabHeight}) / ${numberOfModules})`,
					transform	: `translate( calc( -1 * ${ DAY / ( DAYS.length - 1 ) } * calc( ${width} * ${POP_UP_WIDTH_MULTIPLYER} - ${width} ) ), 0)`
				}}
			>
				<div 
					className={Style.popUpHeader}
					style={{ borderBottom : `1px solid ${borderColor}`}}
				>
					{ DAYS[ DAY ] } Ora :{ data.fromHour + 1 } { data.subject }
				</div>
				<div className={Style.wrapPopUpTeachers}>
				{ data.teachers.map( teacher => (
					<div key={`POP_TEACH_${teacher.Id}`} className={Style.popUpTeacher}>
						<div className={Style.popUpTeacherLabel}>
							<span>{teacher.Name} </span>
							<span>{teacher.Surname} </span>
							<span>{teacher.classYear} {teacher.classSection}</span>
						</div>
						<div className={Style.popUpTeacherButton}
							 style = {{ 
									color :	teacher.isAbsent		? `var(--absent-teacher-color-pop-up)` : 
											teacher.isSubstitution	? `var(--substitution-teacher-color-pop-up)` 
																	: `var(--teacher-color-pop-up)`,
									borderColor : 	teacher.isAbsent		? `var(--absent-teacher-color-pop-up)` : 
													teacher.isSubstitution	? `var(--substitution-teacher-color-pop-up)` 
																			: `var(--teacher-color-pop-up)`,
									backgroundColor:	teacher.isAbsent		? `var(--absent-teacher-background-pop-up)` :
														teacher.isSubstitution 	? `var(--substitution-teacher-background-pop-up)`
																				: `var(--teacher-background-pop-up)` 

									}}
							 onClick={ ev => { 
								let tempDate = new Date(currentDate)
								tempDate.setDate(tempDate.getDate() + DAY + 1)
								if(teacher.isAbsent){
									teacher.isAbsent = false;
									ev.currentTarget.innerText = "segna presente"
									ev.currentTarget.style.color = "var(--absent-teacher-color-pop-up)"
									ev.currentTarget.style.borderColor = "var(--absent-teacher-color-pop-up)"
									ev.currentTarget.style.backgroundColor = "var(--absent-teacher-background-pop-up)"
									setTeacherStatus(teacher.Id, "present", tempDate)
								} 
								else {
									teacher.isAbsent = true;
									ev.currentTarget.innerText = teacher.isSubstitution ? "sta sostituendo" : "segna assente"
									ev.currentTarget.style.color = teacher.isSubstitution 
										? "var(--substitution-teacher-color-pop-up)"
										: "var(--teacher-color-pop-up)"
									ev.currentTarget.style.borderColor = teacher.isSubstitution
										? "var(--substitution-teacher-color-pop-up)"
										: "var(--teacher-color-pop-up)"
									ev.currentTarget.style.backgroundColor = teacher.isSubstitution
										? "var(--substitution-teacher-background-pop-up)"
										: "var(--teacher-background-pop-up)"
									setTeacherStatus(teacher.Id, "absent", tempDate)
								}
								colorIndexSet(generateAbsenceHourStatus(data.teachers))
							 }}
						>
							{teacher.isAbsent ? `segna presente` : teacher.isSubstitution ? `sta sostituendo` : `segna assente`}
						</div>
					</div>
				))}
				</div>
			</div>
		</div>
		)
	}
}

/***********************
 * !                   *
 * * HOUR GRID DISPLAY *
 * ?                   *
 ***********************/

let active : React.Dispatch<React.SetStateAction<boolean>> | null = null

const HourGridDisplay = ({ data, totalHeight, dayTabHeight, cellProps, borderColor, numberOfModules, popUpCol, width, currentDate, hooks, DATA_MAP } : { data : HourData[], popUpCol : string, totalHeight : string, cellProps : CellProps, numberOfModules : number, dayTabHeight : string, width : string, borderColor: string, currentDate : Date, hooks : Array<[number, React.Dispatch<React.SetStateAction<number>>]>, DATA_MAP : Map<string, HourData> }) => {
	
	const TEXT_COLOR = extractColor(cellProps.text_color ),
		  COLORS = [
				extractColor(cellProps.abs_primary_color    ),
				extractColor(cellProps.pres_primary_color   ),
				extractColor(cellProps.sub_primary_color    ),
				extractColor(cellProps.abs_secondary_color  ),
				extractColor(cellProps.pres_secondary_color ),
				extractColor(cellProps.sub_secondary_color  )
		  ],
		  LEN = DAYS.length * numberOfModules

	return (
		<div className={Style.HourGridContainer} style={{
			width,
			gridTemplateColumns : `1fr `.repeat(DAYS.length),
			gridTemplateRows    : `1fr `.repeat(numberOfModules)
		}}>
			{new Array( numberOfModules * DAYS.length ).fill(undefined).map( ( el, index ) => (
				<div className={Style.HourGridCell} key={index} style={{
					border     : `${cellProps.border_size}px solid ${borderColor}`,
					borderTop  : !(~~(index/DAYS.length)) ? `${cellProps.border_size}px solid ${borderColor}` : "0",
					borderLeft : !(index%DAYS.length)     ? `${cellProps.border_size}px solid ${borderColor}` : "0"
				}}>
					<GetItemForCell 
						index={index}
						COLORS={COLORS}
						data={DATA_MAP.get(`${index % DAYS.length + 1}d${~~(index / DAYS.length)}`) as HourData}
						totalHeight={totalHeight}
						dayTabHeight={dayTabHeight}
						popUpCol={popUpCol}
						borderColor={borderColor}
						numberOfModules={numberOfModules}
						width={width}
						TEXT_COLOR={TEXT_COLOR}
						colorIndex={hooks[index][0]}
						colorIndexSet={hooks[index][1]} 
						currentDate={currentDate}/>
				</div>
			))}
		</div>
	)
}

/**********************
 * !                  *
 * *  MAIN COMPONENT  *
 * ?                  *
 **********************/

export default ( { 
	height,
	width,
	hourTabWidth,
	dayTabHeight,
	data,
	accent_color,
	primary_color,
	secondary_color,
	cellProps,
	hourIndentationWidth,
	timeSettings
} : Props) => {

	const [week, setWeek]             = useState(CURRENT_WEEK),
		  [Actualdata, setActualData] = useState(new Array<HourData>())

	const actualH      = extractMaybeSize( height ),
		  actualW      = extractMaybeSize( width  ),
		  actualAccCol = extractColor( accent_color    ),
		  actualPriCol = extractColor( primary_color   ),
		  actualSecCol = extractColor( secondary_color ),
		  NUMBER_OF_MODULES = ( getIntegerFromTime(timeSettings.toHour)
							- getIntegerFromTime(timeSettings.fromHour) )
							/ getIntegerFromTime(timeSettings.hourLenght)

	const LEN			= DAYS.length * NUMBER_OF_MODULES,
		  actualDayTabHeight = extractSize( dayTabHeight ),
		  actualHourIndentW  = extractSize( hourIndentationWidth  ),
		  actualHourIndentS  = extractSize( cellProps.border_size ),
		  HOOKS = new Array<[number, React.Dispatch<React.SetStateAction<number>>]>(LEN),
		  [ DATA_MAP, SET_DATA_MAP ] = useState( new Map<string, HourData>() )

	useEffect( () => {
		sendDataRequest(data, week)
			.then( values => {
				let tMap = new Map<string, HourData>()
				setActualData(values)
				values.forEach( el => 
					tMap.set(`${el.day}d${el.fromHour}`, el)
				)
				for(let i = 0; i < LEN; i++ ) 
					HOOKS[i][1](generateAbsenceHourStatus(tMap.get(`${i % DAYS.length + 1}d${~~(i / DAYS.length)}`)?.teachers as TeacherData[]))
				
				SET_DATA_MAP(tMap)
			 } )
		}, []
	)

	for(let i = 0; i < LEN; i++ ) {
		HOOKS[i] = useState(generateAbsenceHourStatus(DATA_MAP.get(`${i % DAYS.length + 1}d${~~(i / DAYS.length)}`)?.teachers as TeacherData[]))
	}

	return (
	<div 
		className={Style.schedulerWrap}
		style={{
			height : actualH,
			width  : actualW,
			backgroundColor : actualPriCol
		}}
	>
		<div className={Style.topWrap}>
			<div className={Style.empty} style={{width:hourTabWidth, height:"100%"}}/>
			<DayView 
				currentWeek={week} 
				height={actualDayTabHeight} 
				width={`calc(100% - ${hourTabWidth})`}
				accent_color={actualAccCol}
				accent_text_color={actualPriCol}
			/>
		</div>
		<div className={Style.bottomWrap}>
			<HourDisplay 
				hourTabWidth={`calc(${hourTabWidth} - ${actualHourIndentW})`}
				cellBorderSize={extractSize(cellProps.border_size)}
				timeSettings={timeSettings} 
				numberOfModules={NUMBER_OF_MODULES}
			/>
			<HourIndentation 
				color={actualSecCol} 
				numberOfModules={NUMBER_OF_MODULES}
				width={actualHourIndentW}
				size={actualHourIndentS}
			/>
			<HourGridDisplay 
				dayTabHeight={actualDayTabHeight}
				borderColor={actualSecCol}
				popUpCol={actualPriCol}
				data={Actualdata}
				cellProps={cellProps}
				numberOfModules={NUMBER_OF_MODULES}
				totalHeight={actualH}
				currentDate={week}
				hooks={HOOKS}
				width={`calc(100% - ${hourTabWidth})`} 
				DATA_MAP={DATA_MAP}
			/>
		</div>
		
	</div>
	)
}