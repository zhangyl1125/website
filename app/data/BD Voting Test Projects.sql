-- BD voting test projects
-- Import with:
--   docker exec -i hackhub-postgres psql -U hackhub -d hackhub < "data/BD Voting Test Projects.sql"
--
-- The script is idempotent. It targets the newest open/running platform-wide
-- hackathon and creates six projects owned by real entries from BD Namelist.XLSX.
-- Generated test-account password: BDVoteTest@2026

DO $$
DECLARE
    v_hackathon_id UUID;
    v_profile_id UUID;
    v_team_id UUID;
    v_namespace CONSTANT UUID := 'bbad8422-079f-5ef4-8baf-0861bf6160dc';
    project RECORD;
BEGIN
    SELECT id
      INTO v_hackathon_id
      FROM hackathons
     WHERE organization_id IS NULL
       AND status IN ('open', 'running')
     ORDER BY created_at DESC
     LIMIT 1;

    IF v_hackathon_id IS NULL THEN
        RAISE EXCEPTION 'No open or running platform-wide hackathon is available';
    END IF;

    FOR project IN
        SELECT * FROM (VALUES
            ('01', '85161177', 'BD/SWD-WDE1', 'ZOU Yi', 'bd-test.zou.yi@bosch.com',
             '智能代码审查平台', '面向研发团队的 AI 代码审查、缺陷定位与修复建议平台。',
             'AI & Software', ARRAY['JAVA','AI','REACT'], 'BD SWD Code Pioneers',
             'bd-voting-test/project-01.svg'),
            ('02', '85177507', 'BD/SWD-FSB2', 'LUO Joya', 'bd-test.luo.joya@bosch.com',
             '数字孪生工厂', '通过实时设备数据构建数字孪生，预测产线瓶颈并优化能耗。',
             'Industry 4.0', ARRAY['IOT','DIGITAL TWIN','VUE.JS'], 'BD SWD Twin Makers',
             'bd-voting-test/project-02.svg'),
            ('03', '85230815', 'BD/SWD-BEA5', 'LI Yangchun Ted', 'bd-test.li.yangchun@bosch.com',
             'AI 测试用例生成器', '根据需求与接口定义自动生成、执行并维护回归测试用例。',
             'Developer Tools', ARRAY['AI','PYTHON','TEST AUTOMATION'], 'BD SWD Quality AI',
             'bd-voting-test/project-03.svg'),
            ('04', '85033734', 'BD/PTD-S2P3', 'WANG Nick', 'bd-test.wang.nick@bosch.com',
             '碳足迹驾驶舱', '汇总产品全生命周期数据，提供可追溯的碳排放分析与减排建议。',
             'Sustainability', ARRAY['DATA','POSTGRESQL','REACT'], 'BD PTD Green Trackers',
             'bd-voting-test/project-04.svg'),
            ('05', '85056709', 'BD/ISA-SSP7', 'CHEN Xingxing', 'bd-test.chen.xingxing@bosch.com',
             '企业知识安全助手', '在权限控制和引用溯源基础上为员工提供可信的企业知识问答。',
             'Knowledge Management', ARRAY['RAG','SECURITY','JAVA'], 'BD ISA Knowledge Guard',
             'bd-voting-test/project-05.svg'),
            ('06', '85020668', 'BD/DPA-SRE3', 'XIE Barrie', 'bd-test.xie.barrie@bosch.com',
             '流程挖掘优化器', '从业务事件日志发现流程偏差，量化瓶颈并推荐自动化改进方案。',
             'Process Intelligence', ARRAY['PROCESS MINING','PYTHON','DATA'], 'BD DPA Flow Optimizers',
             'bd-voting-test/project-06.svg')
        ) AS seed(sequence_no, personnel_number, organizational_unit, profile_name, email,
                  title, description, category, tags, team_name, image_key)
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM voting_participants vp
             WHERE vp.personnel_number = project.personnel_number
               AND vp.organizational_unit = project.organizational_unit
        ) THEN
            RAISE EXCEPTION 'BD roster entry % / % is missing',
                project.personnel_number, project.organizational_unit;
        END IF;

        INSERT INTO profiles (id, email, name, password_hash, role, skills)
        VALUES (
            uuid_generate_v5(v_namespace, 'profile-' || project.personnel_number),
            project.email,
            project.profile_name,
            crypt('BDVoteTest@2026', gen_salt('bf', 12)),
            'participant',
            project.tags
        )
        ON CONFLICT (email) DO NOTHING;

        SELECT id INTO v_profile_id FROM profiles WHERE email = project.email;

        INSERT INTO teams (id, name, description, hackathon_id, created_by, is_open, skills)
        VALUES (
            uuid_generate_v5(v_namespace, 'team-' || project.sequence_no),
            project.team_name,
            project.description,
            v_hackathon_id,
            v_profile_id,
            TRUE,
            project.tags
        )
        ON CONFLICT (name, hackathon_id) DO NOTHING;

        SELECT id INTO v_team_id
          FROM teams
         WHERE name = project.team_name
           AND hackathon_id = v_hackathon_id;

        INSERT INTO team_members (team_id, user_id, role)
        VALUES (v_team_id, v_profile_id, 'leader')
        ON CONFLICT (team_id, user_id) DO NOTHING;

        INSERT INTO ideas (
            id, title, description, hackathon_id, team_id, created_by, category,
            tags, status, attachments, repository_url, demo_url, project_attachments
        )
        VALUES (
            uuid_generate_v5(v_namespace, 'idea-' || project.sequence_no),
            project.title,
            project.description,
            v_hackathon_id,
            v_team_id,
            v_profile_id,
            project.category,
            project.tags,
            'submitted',
            ARRAY[]::TEXT[],
            'https://github.com/hackhub-demo/bd-voting-project-' || project.sequence_no,
            NULL,
            jsonb_build_array(jsonb_build_object(
                'type', 'screenshot',
                'name', 'project-' || project.sequence_no || '.svg',
                'url', '/storage/hackhub-project-attachments/' || project.image_key,
                'storageKey', project.image_key
            ))
        )
        ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            hackathon_id = EXCLUDED.hackathon_id,
            team_id = EXCLUDED.team_id,
            created_by = EXCLUDED.created_by,
            category = EXCLUDED.category,
            tags = EXCLUDED.tags,
            status = EXCLUDED.status,
            repository_url = EXCLUDED.repository_url,
            project_attachments = EXCLUDED.project_attachments,
            updated_at = NOW();
    END LOOP;
END $$;

